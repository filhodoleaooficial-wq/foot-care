# Como Hospedar o App em um VPS (Nginx)

> Passo a passo para colocar o app em um servidor VPS (DigitalOcean, Vultr, Linode, etc.)

---

## 1. Criar o VPS

1. Acesse o painel do seu provedor (DigitalOcean, Vultr, etc.)
2. Crie um "Droplet" ou "VPS"
3. Escolha: **Ubuntu 22.04** ou **24.04**
4. Plano mínimo: **$6/mês** (1 vCPU, 1GB RAM) — suficiente para este app
5. Escolha a região mais próxima do seu público
6. Crie um **password** ou **SSH key** para acesso
7. Anote o **IP do servidor**

---

## 2. Conectar ao VPS

No seu computador, abra o terminal e rode:

```bash
ssh root@SEU_IP
```

Exemplo:
```bash
ssh root@143.198.200.100
```

Digite a senha quando pedido.

---

## 3. Atualizar o servidor

```bash
apt update && apt upgrade -y
```

---

## 4. Instalar o Nginx

```bash
apt install nginx -y
```

Para verificar se instalou:
```bash
systemctl status nginx
```

---

## 5. Instalar o Node.js (para buildar o app)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y
```

Verificar:
```bash
node -v
npm -v
```

---

## 6. Instalar o Git

```bash
apt install git -y
```

---

## 7. Clonar o repositório

```bash
cd /var/www
git clone https://github.com/seu-usuario/meu-p.git
cd meu-p
```

---

## 8. Buildar o app

```bash
npm install
npm run build
```

Isso vai criar a pasta `dist/` com todos os arquivos prontos.

---

## 9. Configurar o Nginx

Crie um arquivo de configuração:

```bash
nano /etc/nginx/sites-available/meu-p
```

Cole o seguinte (substitua `seudominio.com` pelo seu domínio ou IP):

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    root /var/www/meu-p/dist;
    index index.html;

    # Rotas do React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compressão gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
```

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## 10. Ativar o site

```bash
ln -s /etc/nginx/sites-available/meu-p /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Se mostrar `nginx: configuration file test is successful`, está tudo certo.

---

## 11. SSL (HTTPS) — Opcional mas recomendado

Instale o Certbot para certificado gratuito:

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d seudominio.com -d www.seudominio.com
```

Siga as instruções na tela. O certificado renova automaticamente.

---

## 12. Atualizar o app no servidor

Sempre que fizer alterações no código:

No seu computador:
```bash
git add .
git commit -m "Minha alteração"
git push origin main
```

No VPS:
```bash
cd /var/www/meu-p
git pull origin main
npm run build
systemctl reload nginx
```

---

## Resumo dos comandos (cópia e cola)

```bash
# Conectar
ssh root@SEU_IP

# Atualizar
apt update && apt upgrade -y

# Instalar dependências
apt install nginx git -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# Clonar e buildar
cd /var/www
git clone https://github.com/seu-usuario/meu-p.git
cd meu-p
npm install
npm run build

# Configurar Nginx (criar arquivo e ativar)
nano /etc/nginx/sites-available/meu-p
ln -s /etc/nginx/sites-available/meu-p /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# SSL (opcional)
apt install certbot python3-certbot-nginx -y
certbot --nginx -d seudominio.com
```

---

## Dúvidas comuns

### "O app carrega mas as rotas dão 404?"
A configuração do Nginx com `try_files $uri $uri/ /index.html` resolve isso. Verifique se está no arquivo de configuração.

### "Preciso de domínio?"
Não. Pode acessar direto pelo IP: `http://143.198.200.100`. Mas com domínio fica mais profissional.

### "Como atualizo o app?"
Só fazer `git pull` + `npm run build` no servidor.

### "Preciso de Docker?"
Não. Para este app, Nginx direto é suficiente e mais simples.

---

*Guia criado em julho de 2026.*
