const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const session = require('express-session');
const ejs = require('ejs');
const app = express();
const port = 3000;
const path = require('path');
const mime = require('mime-types');



app.use(express.static(path.join(__dirname,'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'chave_seguranca_para_teste_backend',
    resave: false,
    saveUninitialized: true
  }));

async function initializeDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'teste_backend'
    });
    return connection;
  } catch (err) {
    console.error('Erro na conexão com o banco de dados:', err);
    throw err;
  }
}

async function autenticar(email, senha) {
  try {
    const connection = await initializeDB();
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    const [rows] = await connection.query(query, [email]);
    connection.end();

    if (rows.length === 0) {
      throw new Error('E-mail ou senha incorretos');
    }

    const user = rows[0];
    if (user.senha !== senha) {
      throw new Error('E-mail ou senha incorretos');
    }

    if (user.ativo !== 1) {
        throw new Error('Usuário não está ativo');
      }
    return user;
  } catch (err) {
    throw err;
  }
}

// Configuração para parse do corpo das requisições
app.use(bodyParser.urlencoded({ extended: true }));

// Rota raiz que redireciona para a página de login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Rota para a página de login
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// Rota para a página de cadastro
app.get('/cadastro', (req, res) => {
  res.sendFile(__dirname + '/public/cadastro.html');
});

// Rota para cadastrar um novo usuário
app.post('/api/cadastrar', async (req, res) => {
  const { nome, email, senha, avatar, dataNascimento, ativo } = req.body;


  if (!avatar || !isValidImage(avatar)) {
    return res.status(400).json({ error: 'Por favor, envie uma imagem válida como avatar' });
  }
  
  try {
    const connection = await initializeDB();
    const query = 'SELECT COUNT(*) as total FROM usuarios WHERE email = ?';
    const [rows] = await connection.query(query, [email]);
    const { total } = rows[0];

    if (total > 0) {
      connection.end();
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const newUser = {
      nome,
      email,
      senha,
      avatar,
      data_nascimento: dataNascimento,
      ativo: true
    };

    await connection.query('INSERT INTO usuarios SET ?', newUser);
    connection.end();

    res.redirect('/login');
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
});



function isValidImage(imageUrl) {
    const mimeType = mime.lookup(imageUrl);
    return mimeType && mimeType.startsWith('image');
  }

// Rota para o login
app.post('/api/login', async (req, res) => {
 
  const { email, senha } = req.body;

  try {
    const user = await autenticar(email, senha);
    req.session.user = user;
    req.session.avatar = user.avatar; 
    res.redirect('/login-success'); 
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
});

// Rota intermediária para processar o login bem-sucedido e redirecionar para a página home
app.get('/login-success', (req, res) => {
    res.redirect('/home');
  });

// Rota para a página "home" (apenas acessível por usuários autenticados)
app.get('/home', async (req, res) => {
    
    if (!req.session.user) {
      return res.status(401).send('Acesso não autorizado. Faça login para continuar.');
    }
  
    const { data_nascimento } = req.session.user;
    const avatar = req.session.avatar;

  // Calcula a diferença entre a data de aniversário do usuário e a data atual
  const hoje = new Date();
  const aniversario = new Date(data_nascimento);
  aniversario.setFullYear(hoje.getFullYear()); // Define o ano do aniversário para o ano atual

  // Verifica se a data de aniversário já passou no ano atual. Se sim, define o aniversário para o próximo ano.
  if (hoje > aniversario) {
    aniversario.setFullYear(hoje.getFullYear() + 1);
  }

  // Calcula a diferença em milissegundos entre a data de aniversário e a data atual
  const diffMs = aniversario - hoje;

  // Calcula a diferença em dias e meses
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMeses = Math.floor(diffDias / 30.44); // Assumindo que um mês tem aproximadamente 30,44 dias

  // Renderiza a página "home" e passa os valores de dias e meses como variáveis para serem exibidas na tela
  res.render('home', { diasFaltantes: diffDias, mesesFaltantes: diffMeses, avatar: avatar });
  });



  app.post('/logout', (req, res) => {
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Erro ao encerrar a sessão:', err);
      }
      res.redirect('/login'); 
    });
  });



  app.get('/perfil', (req, res) => {
    if (!req.session.user) {
      return res.status(401).send('Acesso não autorizado. Faça login para continuar.');
    }
  
    res.render('perfil', { user: req.session.user });
  });


  async function atualizarUsuario(id, nome, email, senha, avatar, dataNascimento) {
    try {
      const connection = await initializeDB();
      const query = 'UPDATE usuarios SET nome = ?, email = ?, senha = ?, avatar = ?, data_nascimento = ? WHERE id = ?';
      await connection.query(query, [nome, email, senha, avatar, dataNascimento, id]);
      connection.end();
    } catch (err) {
      throw err;
    }
  }
  


  app.post('/atualizar', async (req, res) => {
    if (!req.session.user) {
      return res.status(401).send('Acesso não autorizado. Faça login para continuar.');
    }
  
    const { nome, email, senha, avatar, dataNascimento } = req.body;
  
    try {
      const connection = await initializeDB();
      const query = 'SELECT * FROM usuarios WHERE email = ? AND id != ?';
      const [rows] = await connection.query(query, [email, req.session.user.id]);
      connection.end();
  
      if (rows.length > 0) {
        return res.status(409).json({ error: 'E-mail já cadastrado' });
      }
  
      await atualizarUsuario(req.session.user.id, nome, email, senha, avatar, dataNascimento);
  
      req.session.user.nome = nome;
      req.session.user.email = email;
      req.session.user.senha = senha;
      req.session.user.avatar = avatar;
      req.session.user.data_nascimento = dataNascimento;
  
      res.redirect('/perfil');
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  });


  app.post('/api/desativar', async (req, res) => {
    try {
      const { id } = req.session.user;
  
      const connection = await initializeDB();
      const query = 'UPDATE usuarios SET ativo = 0 WHERE id = ?';
      await connection.query(query, [id]);
      connection.end();
  
      // Encerra a sessão para deslogar o usuário
      req.session.destroy((err) => {
        if (err) {
          console.error('Erro ao encerrar a sessão:', err);
        }
        res.redirect('/login'); // Redireciona para a tela de login após desativar a conta
      });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao desativar a conta' });
    }
  });




app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});


module.exports = app;
