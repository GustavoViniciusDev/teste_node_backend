# Use uma imagem Node.js como base
FROM node
WORKDIR /appjs
COPY app.js .
EXPOSE 3000
CMD [ "node", "app.js" ]