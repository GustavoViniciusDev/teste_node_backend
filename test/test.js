const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../app'); 

describe('Testes de login', () => {
  it('Deve retornar status 200 e redirecionar para a tela de home após o login', (done) => {
    request(app)
      .post('/api/login')
      .send({ email: 'usuario@teste.com', senha: 'teste123' })
      .expect(302) 
      .expect('Location', '/login-success') // Altere para a rota correta que redireciona para a tela home
      .end(done);
  });

  it('Deve retornar status 401 e mensagem de erro ao tentar login com credenciais inválidas', (done) => {
    request(app)
      .post('/api/login')
      .send({ email: 'usuario@teste.com', senha: 'senha_errada' })
      .expect(401) 
      .expect((res) => {
        expect(res.body.error).to.equal('E-mail ou senha incorretos');
      })
      .end(done);
  });
});

describe('Testes de cadastro', () => {
  it('Deve cadastrar um novo usuário e retornar status 201', (done) => {
    request(app)
      .post('/api/cadastrar')
      .send({
        nome: 'Novo Usuário',
        email: 'novo@teste.com',
        senha: 'teste123',
        avatar: 'img1.jpg', 
        dataNascimento: '1990-01-01',
      })
      .expect(201)
      .end(done);
  });

  it('Deve retornar status 409 e mensagem de erro ao tentar cadastrar um usuário com e-mail já existente', (done) => {
    request(app)
      .post('/api/cadastrar')
      .send({
        nome: 'Usuário Existente',
        email: 'usuario@teste.com',
        senha: 'teste123',
        avatar: 'img1.jpg',
        dataNascimento: '1990-01-01',
      })
      .expect(409)
      .expect((res) => {
        expect(res.body.error).to.equal('E-mail já cadastrado');
      })
      .end(done);
  });
});

describe('Testes de atualização de perfil', () => {
  it('Deve atualizar o perfil do usuário e retornar status 302 após o login', (done) => {
    request(app)
      .post('/api/login')
      .send({ email: 'usuario@teste.com', senha: 'teste123' })
      .expect(302)
      .end((loginErr, loginRes) => {
        if (loginErr) return done(loginErr);

        const cookie = loginRes.headers['set-cookie'];

        request(app)
          .post('/atualizar')
          .send({
            nome: 'Novo Nome',
            email: 'novo@teste.com',
            senha: 'nova_senha',
            avatar: 'novo_avatar.png',
            dataNascimento: '1990-01-01',
          })
          .set('Cookie', cookie)
          .expect(302)
          .end(done);
      });
  });

  it('Deve retornar status 401 ao tentar atualizar o perfil sem estar logado', (done) => {
    request(app)
      .post('/atualizar')
      .send({
        nome: 'Novo Nome',
        email: 'novo@teste.com',
        senha: 'nova_senha',
        avatar: 'novo_avatar.png', 
        dataNascimento: '1990-01-01',
      })
      .expect(401)
      .end(done);
  });

 
});

describe('Testes de desativação de conta', () => {
  it('Deve desativar a conta do usuário e retornar status 302 após o login', (done) => {
    request(app)
      .post('/api/login')
      .send({ email: 'usuario@teste.com', senha: 'teste123' })
      .expect(302)
      .end((loginErr, loginRes) => {
        if (loginErr) return done(loginErr);

        const cookie = loginRes.headers['set-cookie'];

        request(app)
          .post('/api/desativar')
          .set('Cookie', cookie) 
          .expect(302)
          .end(done);
      });
  });

  it('Deve retornar status 401 ao tentar desativar a conta sem estar logado', (done) => {
    request(app)
      .post('/api/desativar')
      .expect(401)
      .end(done);
  });


});

