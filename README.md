# YOLO-node

Teste do YOLO com node num bot do telegram.

## Dependêcias

É preciso ter o Node, o NPM, o OpenCV 2, tipo a 2.4.9.1 (se vire para instalar) e um compilador de C e C++.

## Como instalar

Primeiro, compile [essa versão](https://github.com/OrKoN/darknet) da darknet com suporte a OpenCV (opcionalmente com suporte a GPU):

```bash
git clone https://github.com/OrKoN/darknet
cd darknet
make OPENCV=1 # optionally GPU=1
make install # by default installed to /usr/local
```

Dentro da pasta raiz do projeto, rode:

```bash
npm install
```
e depois:
```bash
wget http://pjreddie.com/media/files/yolo.weights
```

Como o projeto é um bot do telegram, para funcionar ele precisa de um token de bot vlido do telegram.
Para configurar isso, coloque uma variável de ambiente TOKEN com um token de bot do telegram. Opcionalmente, você pode criar um arquivo .env com a entrada:

```
TOKEN='token-válido-do-telegram'
```

## Como rodar

Basta usar o seguinte comando no terminal:

```bash
npm start
```
E o bot estará funcionando.

## Outras dependências e mais documentação

[https://github.com/moovel/node-yolo](https://github.com/moovel/node-yolo)
