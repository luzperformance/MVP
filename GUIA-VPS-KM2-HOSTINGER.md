# Guia Completo: VPS KM2 da Hostinger

> Guia prático e técnico para administração, segurança e otimização da sua VPS KM2.

---

## Sumário

1. [Visão Geral da VPS KM2](#1-visão-geral-da-vps-km2-hostinger)
2. [Configuração Inicial e Acesso Seguro](#2-configuração-inicial-e-acesso-seguro)
3. [Gerenciamento Essencial do Servidor](#3-gerenciamento-essencial-do-servidor)
4. [Otimização para Projetos Específicos](#4-otimização-para-projetos-específicos)
5. [Segurança Robusta](#5-segurança-robusta)
6. [Melhorias de Desempenho](#6-melhorias-de-desempenho)
7. [Casos de Uso Comuns e Exemplos Práticos](#7-casos-de-uso-comuns-e-exemplos-práticos)
8. [Recursos Adicionais e Suporte Hostinger](#8-recursos-adicionais-e-suporte-hostinger)

---

## 1. Visão Geral da VPS KM2 Hostinger

### 1.1 Especificações Técnicas

| Recurso                | Especificação                  |
|------------------------|--------------------------------|
| **CPU**                | 2 vCPUs (AMD EPYC)            |
| **RAM**                | 8 GB DDR4                     |
| **Armazenamento**      | 100 GB NVMe SSD               |
| **Transferência**       | 8 TB/mês                      |
| **Velocidade de Rede** | 1 Gbps                        |
| **Virtualização**       | KVM (Kernel-based Virtual Machine) |
| **Backups**            | Semanais automáticos (gratuito) |
| **Snapshots**          | 1 manual (válido por 20 dias) |
| **SLA**                | 99,9% de uptime               |

### 1.2 O Que Essas Especificações Significam na Prática

**2 vCPUs AMD EPYC:** Processadores de classe datacenter. Dois núcleos virtuais permitem executar tarefas concorrentes — por exemplo, um servidor web respondendo requisições enquanto um processo de banco de dados executa consultas. É suficiente para aplicações de médio porte, mas operações intensivas de CPU (compilação pesada, encoding de vídeo) serão limitadas.

**8 GB RAM:** Memória confortável para a maioria dos cenários. Permite rodar simultaneamente um servidor web (Nginx ~50-100MB), um banco de dados (MySQL ~300MB-1GB), uma aplicação Node.js ou Python (~200-500MB) e ainda ter margem para cache e processos do sistema. Monitorar o uso de RAM é essencial para evitar swap, que degrada a performance.

**100 GB NVMe SSD:** Armazenamento rápido com latência muito inferior a SSDs SATA convencionais. NVMe oferece velocidades de leitura/escrita significativamente superiores, o que beneficia bancos de dados e operações de I/O. 100GB acomodam vários projetos de médio porte, mas logs e backups locais podem consumir espaço rapidamente — configure rotação de logs.

**8 TB de Transferência:** Volume generoso. Considerando que uma página web média tem ~3MB, isso suporta aproximadamente 2,6 milhões de page views por mês. Para APIs que retornam JSON leve (~5KB por resposta), o limite comporta bilhões de requisições antes de ser atingido. Na prática, este não será seu gargalo.

**1 Gbps de Rede:** Velocidade máxima teórica de download/upload. Na prática, o throughput real depende de latência e da carga do datacenter, mas é mais que suficiente para servir conteúdo web e APIs com agilidade.

**KVM:** Ao contrário de containers (OpenVZ), a virtualização KVM oferece um kernel isolado e dedicado. Você tem controle total sobre o sistema operacional, pode carregar módulos do kernel e há isolamento real entre sua VPS e outras no mesmo host físico.

### 1.3 Sistemas Operacionais Disponíveis

A Hostinger oferece templates divididos em três categorias:

- **SO Puro:** Apenas o sistema operacional, sem software adicional
- **SO com Painel:** Inclui painéis de controle (cPanel, Plesk, Webmin, etc.)
- **Aplicação:** Templates com software pré-instalado (WordPress, Docker, etc.)

**Distribuições disponíveis:**

| Família       | Versões                      | Recomendação                         |
|---------------|------------------------------|--------------------------------------|
| Ubuntu        | 22.04, 24.04, 25.04, 25.10  | **24.04 LTS** — melhor equilíbrio    |
| Debian        | 11, 12, 13                   | **12** — estável e leve              |
| AlmaLinux     | 8, 9, 10                     | Substituto do CentOS (RHEL-based)    |
| Rocky Linux   | 8, 9                         | Alternativa RHEL-based               |
| CentOS Stream | 9, 10                        | Para quem precisa de compatibilidade |
| Fedora Cloud  | Últimas versões              | Para testes de tecnologias recentes  |
| Kali Linux    | Última versão                | Pentest e segurança                  |
| Alpine Linux  | Última versão                | Mínimo e ultra-leve                  |

**Recomendação:** Para a maioria dos projetos de produção, use **Ubuntu 24.04 LTS** pela comunidade extensa, documentação abundante e suporte de longo prazo (até 2029).

---

## 2. Configuração Inicial e Acesso Seguro

### 2.1 Processo Pós-Contratação

1. **Login no hPanel:** Acesse [hpanel.hostinger.com](https://hpanel.hostinger.com) com suas credenciais.
2. **Seção VPS:** No menu lateral, clique em **VPS** para ver seu servidor.
3. **Configuração Inicial:** Na primeira vez, o hPanel pedirá que você:
   - Escolha o sistema operacional (recomendo Ubuntu 24.04 LTS)
   - Defina a senha de root
   - Opcionalmente, adicione uma chave SSH
4. **Aguarde a instalação:** O provisionamento leva de 1 a 5 minutos.
5. **Anote as informações:** IP do servidor, porta SSH (padrão 22), usuário root.

### 2.2 Navegação no hPanel para VPS

O painel hPanel da Hostinger para VPS inclui:

- **Dashboard:** Visão geral de uso de CPU, RAM, disco e rede
- **Gerenciamento de SO:** Reinstalação, troca de template
- **SSH Keys:** Adicionar/remover chaves públicas
- **Snapshots:** Criar e restaurar snapshots manuais
- **Backups:** Visualizar e restaurar backups automáticos
- **Firewall:** Configurar regras de entrada/saída
- **Configurações:** Hostname, DNS reverso, reiniciar/parar servidor

### 2.3 Conexão via SSH

**No Linux/macOS (Terminal nativo):**
```bash
ssh root@SEU_IP_DO_SERVIDOR
```

**No Windows:**
- **Terminal Windows (PowerShell):** O Windows 10/11 já inclui cliente SSH nativo
  ```powershell
  ssh root@SEU_IP_DO_SERVIDOR
  ```
- **PuTTY:** Cliente gráfico para quem prefere interface visual
- **Windows Terminal + WSL:** Ambiente Linux completo dentro do Windows

### 2.4 Geração e Configuração de Chaves SSH

Chaves SSH eliminam a necessidade de senhas e são significativamente mais seguras contra ataques de força bruta.

**Passo 1 — Gerar o par de chaves na sua máquina local:**
```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```
- `ed25519` é o algoritmo mais moderno e seguro (alternativa: `rsa` com 4096 bits)
- Quando solicitado, defina uma passphrase (senha da chave — camada extra de proteção)
- Serão criados dois arquivos: `~/.ssh/id_ed25519` (privada) e `~/.ssh/id_ed25519.pub` (pública)

**Passo 2 — Enviar a chave pública para o servidor:**

*Opção A — Via hPanel:*
1. Acesse VPS → Settings → SSH Keys
2. Clique em "Add SSH Key"
3. Cole o conteúdo de `id_ed25519.pub`

*Opção B — Via terminal:*
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@SEU_IP_DO_SERVIDOR
```

*Opção C — Manualmente:*
```bash
# No servidor
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Cole a chave pública, salve, e defina permissões:
chmod 600 ~/.ssh/authorized_keys
```

**Passo 3 — Testar a conexão:**
```bash
ssh -i ~/.ssh/id_ed25519 root@SEU_IP_DO_SERVIDOR
```

**Passo 4 — Desabilitar autenticação por senha (após confirmar que a chave funciona):**
```bash
sudo nano /etc/ssh/sshd_config
```
Altere:
```
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin prohibit-password
```
Reinicie o SSH:
```bash
sudo systemctl restart sshd
```

> **Aviso crítico:** Teste a conexão com chave em uma sessão separada *antes* de desabilitar a senha. Perder o acesso por descuido exigirá restauração pelo hPanel.

### 2.5 Primeiros Comandos Após o Login

```bash
# 1. Atualizar lista de pacotes e aplicar upgrades de segurança
sudo apt update && sudo apt upgrade -y

# 2. Configurar timezone
sudo timedatectl set-timezone America/Sao_Paulo

# 3. Verificar hostname
hostnamectl

# 4. Instalar ferramentas essenciais
sudo apt install -y curl wget git htop unzip software-properties-common

# 5. Criar um usuário não-root para uso diário
sudo adduser deploy
sudo usermod -aG sudo deploy

# 6. Copiar a chave SSH para o novo usuário
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 7. Testar acesso com o novo usuário (em outra sessão)
# ssh deploy@SEU_IP_DO_SERVIDOR
```

A partir deste ponto, use o usuário `deploy` (ou outro não-root) para operações do dia a dia e reserve `root` apenas para tarefas administrativas.

---

## 3. Gerenciamento Essencial do Servidor

### 3.1 Monitoramento de Recursos

#### Via Linha de Comando

**CPU e RAM em tempo real — `htop`:**
```bash
htop
```
- Barras no topo: uso de cada vCPU e total de RAM
- Lista de processos ordenável por CPU% ou MEM%
- Pressione `F6` para ordenar, `F9` para matar processos, `q` para sair

**Espaço em disco — `df`:**
```bash
df -h
```
Saída relevante:
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        98G   12G   82G  13% /
```
**Regra prática:** Mantenha o uso abaixo de 80%. Acima de 90%, operações de escrita podem falhar.

**Uso de disco por diretório — `du`:**
```bash
# Os 10 maiores diretórios a partir da raiz
sudo du -h --max-depth=1 / | sort -rh | head -10
```

**Tráfego de rede — `vnstat`:**
```bash
sudo apt install vnstat -y
# Resumo mensal
vnstat -m
# Tráfego em tempo real
vnstat -l
```

**Uso de memória detalhado:**
```bash
free -h
```
Observe a linha `available`: é a memória realmente livre, considerando buffers e cache.

**Carga do sistema:**
```bash
uptime
```
O `load average` mostra a carga nos últimos 1, 5 e 15 minutos. Para 2 vCPUs, valores abaixo de 2.0 são saudáveis.

#### Via hPanel

O painel da Hostinger exibe gráficos de:
- Uso de CPU (%)
- Uso de RAM (%)
- Uso de disco
- Tráfego de rede (entrada/saída)

Esses gráficos são úteis para identificar tendências de longo prazo, mas para diagnóstico em tempo real, as ferramentas de linha de comando são superiores.

### 3.2 Atualizações do Sistema

**Frequência recomendada:**

| Tipo                  | Frequência         | Comando                                    |
|-----------------------|--------------------|---------------------------------------------|
| Segurança (críticas)  | Imediata           | `sudo apt upgrade`                          |
| Pacotes gerais        | Semanal            | `sudo apt update && sudo apt upgrade -y`    |
| Kernel                | Mensal (com teste) | `sudo apt dist-upgrade -y && sudo reboot`   |
| Atualizações automáticas | Configurar    | `sudo apt install unattended-upgrades`      |

**Configurar atualizações automáticas de segurança:**
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

Edite `/etc/apt/apt.conf.d/50unattended-upgrades` para personalizar quais pacotes são atualizados automaticamente. A configuração padrão do Ubuntu já inclui security updates.

### 3.3 Estratégia de Backups

#### Camadas de Proteção

| Camada                  | Ferramenta            | Frequência     | Local             |
|-------------------------|-----------------------|----------------|-------------------|
| **1. Backups Hostinger** | hPanel (automático)  | Semanal        | Infraestrutura Hostinger |
| **2. Snapshots**        | hPanel (manual)       | Antes de mudanças | Infraestrutura Hostinger |
| **3. Backup aplicação** | Script customizado    | Diária         | Servidor local    |
| **4. Backup offsite**   | rsync/rclone          | Diária         | Externo (S3, etc.)|

#### Script de Backup Automatizado

Crie um script que faz backup dos dados mais importantes:

```bash
#!/usr/bin/env bash
# /opt/scripts/backup.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y-%m-%d_%H%M)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# Backup do banco de dados MySQL/MariaDB
mysqldump --all-databases --single-transaction \
  -u root -p'SUA_SENHA_SEGURA' | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup dos arquivos de aplicação
tar czf "$BACKUP_DIR/apps_$DATE.tar.gz" \
  /var/www \
  /etc/nginx \
  /etc/letsencrypt 2>/dev/null

# Backup das configurações do sistema
tar czf "$BACKUP_DIR/config_$DATE.tar.gz" \
  /etc/ssh/sshd_config \
  /etc/fail2ban \
  /etc/ufw 2>/dev/null

# Remover backups antigos
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup concluído: $BACKUP_DIR"
```

```bash
# Tornar executável e agendar via cron
chmod +x /opt/scripts/backup.sh

# Executar diariamente às 3h da manhã
sudo crontab -e
# Adicione:
0 3 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

#### Backup Offsite com Rclone

```bash
# Instalar rclone
sudo apt install rclone -y

# Configurar destino (ex: AWS S3, Backblaze B2, Google Drive)
rclone config

# Enviar backups para storage externo
rclone sync /opt/backups remote:meu-bucket-backups/vps-km2/
```

**Por que backup offsite é essencial:** Se o servidor for comprometido, corrompido, ou se houver falha na infraestrutura do provedor, seus dados estarão seguros em outro local.

#### Restauração

**Via hPanel (backup Hostinger):**
1. VPS → Backups → Selecione a data desejada → Restaurar
2. **Atenção:** A restauração sobrescreve TODOS os dados atuais e exclui snapshots existentes.

**Via script local:**
```bash
# Restaurar banco de dados
gunzip < /opt/backups/db_2026-03-20_0300.sql.gz | mysql -u root -p

# Restaurar arquivos
tar xzf /opt/backups/apps_2026-03-20_0300.tar.gz -C /
```

---

## 4. Otimização para Projetos Específicos

### 4.1 Stack LEMP (Linux + Nginx + MySQL + PHP)

A stack LEMP é a recomendação para a maioria dos projetos PHP. O Nginx é mais eficiente que o Apache em termos de consumo de memória e conexões simultâneas.

```bash
# Instalar Nginx
sudo apt install nginx -y
sudo systemctl enable nginx

# Instalar MySQL 8
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Instalar PHP 8.3 com extensões comuns
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.3-fpm php8.3-mysql php8.3-mbstring \
  php8.3-xml php8.3-curl php8.3-zip php8.3-gd php8.3-intl \
  php8.3-redis php8.3-opcache -y

# Verificar que tudo está rodando
sudo systemctl status nginx php8.3-fpm mysql
```

### 4.2 Stack LAMP (Linux + Apache + MySQL + PHP)

```bash
# Instalar Apache
sudo apt install apache2 -y
sudo systemctl enable apache2

# Instalar MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Instalar PHP com módulo Apache
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.3 libapache2-mod-php8.3 php8.3-mysql \
  php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-gd -y

# Habilitar módulos úteis do Apache
sudo a2enmod rewrite headers ssl
sudo systemctl restart apache2
```

### 4.3 Node.js (APIs, aplicações React/Next.js SSR)

```bash
# Instalar Node.js via nvm (gerenciador de versões)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

nvm install --lts
nvm use --lts

# Verificar
node -v && npm -v

# Instalar PM2 (gerenciador de processos para produção)
npm install -g pm2

# Iniciar aplicação com PM2
cd /var/www/minha-api
pm2 start server.js --name "minha-api" -i max  # -i max: cluster mode (1 worker por vCPU)
pm2 save
pm2 startup  # gerar script para iniciar com o sistema
```

### 4.4 Python (Django/Flask)

```bash
# Instalar dependências do Python
sudo apt install python3 python3-pip python3-venv -y

# Criar ambiente virtual
mkdir -p /var/www/minha-app && cd /var/www/minha-app
python3 -m venv venv
source venv/bin/activate

# Django
pip install django gunicorn psycopg2-binary

# OU Flask
pip install flask gunicorn

# Rodar com Gunicorn (servidor de produção)
gunicorn --workers 4 --bind 0.0.0.0:8000 minha_app.wsgi:application
```

**Systemd service para produção:**
```ini
# /etc/systemd/system/minha-app.service
[Unit]
Description=Minha App Python
After=network.target

[Service]
User=deploy
Group=www-data
WorkingDirectory=/var/www/minha-app
ExecStart=/var/www/minha-app/venv/bin/gunicorn --workers 4 --bind unix:/run/minha-app.sock minha_app.wsgi:application
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minha-app
```

### 4.5 Configuração do Nginx para Performance

```nginx
# /etc/nginx/nginx.conf — ajustes globais

worker_processes auto;           # 1 worker por vCPU (auto detecta)
worker_connections 1024;         # conexões simultâneas por worker

http {
    # Compressão
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;           # equilíbrio entre compressão e CPU
    gzip_min_length 256;
    gzip_types
        text/plain text/css application/json application/javascript
        text/xml application/xml text/javascript image/svg+xml;

    # Keep-alive
    keepalive_timeout 65;
    keepalive_requests 100;

    # Buffers
    client_max_body_size 50M;    # tamanho máximo de upload
    client_body_buffer_size 128k;

    # Cache de arquivos estáticos
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### 4.6 Configuração do Apache para Performance

```apache
# /etc/apache2/conf-available/performance.conf

# Módulo mpm_event (melhor que prefork para alto tráfego)
<IfModule mpm_event_module>
    StartServers          2
    MinSpareThreads       25
    MaxSpareThreads       75
    ThreadLimit           64
    ThreadsPerChild       25
    MaxRequestWorkers     150
    MaxConnectionsPerChild 3000
</IfModule>

# Compressão
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml
    AddOutputFilterByType DEFLATE text/css application/javascript
    AddOutputFilterByType DEFLATE application/json application/xml
</IfModule>

# Keep-alive
KeepAlive On
KeepAliveTimeout 5
MaxKeepAliveRequests 100
```
```bash
sudo a2dismod mpm_prefork
sudo a2enmod mpm_event deflate
sudo cp /etc/apache2/conf-available/performance.conf /etc/apache2/conf-enabled/
sudo systemctl restart apache2
```

### 4.7 Bancos de Dados

#### MySQL/MariaDB — Otimização Básica

```ini
# /etc/mysql/mysql.conf.d/custom.cnf

[mysqld]
# Com 8GB RAM, alocar ~40-50% para InnoDB (se BD é o uso principal)
innodb_buffer_pool_size = 3G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2    # performance vs durabilidade

# Conexões
max_connections = 150
wait_timeout = 600
interactive_timeout = 600

# Cache de queries (desabilitado por padrão no MySQL 8 — use Redis)
# query_cache_type = OFF

# Logs lentos para diagnóstico
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```
```bash
sudo systemctl restart mysql
```

#### PostgreSQL — Instalação e Otimização

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
```

```ini
# /etc/postgresql/16/main/postgresql.conf

# Memória (8GB RAM total)
shared_buffers = 2GB             # 25% da RAM
effective_cache_size = 6GB       # 75% da RAM
work_mem = 64MB                  # por operação de sort/hash
maintenance_work_mem = 512MB     # para VACUUM, CREATE INDEX

# WAL
wal_buffers = 64MB
max_wal_size = 2GB

# Conexões
max_connections = 100
```
```bash
sudo systemctl restart postgresql
```

### 4.8 Virtual Hosts — Múltiplos Sites no Mesmo Servidor

#### Nginx — Server Blocks

```nginx
# /etc/nginx/sites-available/site1.exemplo.com
server {
    listen 80;
    server_name site1.exemplo.com;
    root /var/www/site1;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```
```bash
# Criar diretório e ativar o site
sudo mkdir -p /var/www/site1
sudo ln -s /etc/nginx/sites-available/site1.exemplo.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### Nginx como Reverse Proxy (para Node.js, Python, etc.)

```nginx
# /etc/nginx/sites-available/api.exemplo.com
server {
    listen 80;
    server_name api.exemplo.com;

    location / {
        proxy_pass http://127.0.0.1:3000;    # porta da sua aplicação
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Apache — Virtual Hosts

```apache
# /etc/apache2/sites-available/site1.exemplo.com.conf
<VirtualHost *:80>
    ServerName site1.exemplo.com
    ServerAlias www.site1.exemplo.com
    DocumentRoot /var/www/site1

    <Directory /var/www/site1>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/site1-error.log
    CustomLog ${APACHE_LOG_DIR}/site1-access.log combined
</VirtualHost>
```
```bash
sudo a2ensite site1.exemplo.com.conf
sudo systemctl reload apache2
```

---

## 5. Segurança Robusta

### 5.1 Gerenciamento de Usuários e Permissões

**Princípio do menor privilégio:** Nunca use `root` para tarefas rotineiras.

```bash
# Criar usuário para cada serviço/aplicação
sudo adduser deploy
sudo usermod -aG sudo deploy

# Configurar permissões de diretórios web
sudo chown -R deploy:www-data /var/www
sudo chmod -R 750 /var/www

# Garantir que novos arquivos herdem o grupo
sudo chmod g+s /var/www
```

**Desabilitar login root direto via SSH:**
```bash
sudo nano /etc/ssh/sshd_config
```
```
PermitRootLogin no
AllowUsers deploy
```
```bash
sudo systemctl restart sshd
```

### 5.2 Firewall com UFW

O UFW (Uncomplicated Firewall) simplifica o gerenciamento do iptables.

```bash
sudo apt install ufw -y

# Política padrão: bloquear tudo que entra, permitir tudo que sai
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (faça isso ANTES de habilitar o UFW)
sudo ufw allow 22/tcp comment 'SSH'

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# (Opcional) Permitir porta customizada de aplicação
# sudo ufw allow 3000/tcp comment 'Node.js App'

# Habilitar o firewall
sudo ufw enable

# Verificar regras ativas
sudo ufw status verbose
```

**Regras avançadas — limitar taxa de conexão SSH:**
```bash
# Limita a 6 conexões em 30 segundos por IP
sudo ufw limit 22/tcp
```

> **Aviso:** No hPanel, a Hostinger também oferece um firewall gerenciado. Use-o como camada adicional, mas o UFW local dá controle mais granular.

### 5.3 Fail2ban — Proteção contra Força Bruta

```bash
sudo apt install fail2ban -y
```

```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime  = 3600         # banir por 1 hora
findtime = 600          # janela de observação: 10 minutos
maxretry = 5            # tentativas antes do ban
backend  = systemd
banaction = ufw          # integração com UFW

[sshd]
enabled = true
port    = 22
logpath = %(sshd_log)s

[nginx-http-auth]
enabled = true

[nginx-botsearch]
enabled = true
```
```bash
sudo systemctl enable --now fail2ban

# Verificar status e IPs banidos
sudo fail2ban-client status sshd
```

### 5.4 HTTPS e Certificados SSL/TLS com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot -y

# Para Nginx
sudo apt install python3-certbot-nginx -y
sudo certbot --nginx -d site1.exemplo.com -d www.site1.exemplo.com

# Para Apache
sudo apt install python3-certbot-apache -y
sudo certbot --apache -d site1.exemplo.com

# Verificar renovação automática
sudo certbot renew --dry-run

# O Certbot já configura um timer systemd para renovação
sudo systemctl list-timers | grep certbot
```

**Reforço de segurança SSL no Nginx:**
```nginx
# Dentro do bloco server (gerado pelo Certbot, mas você pode reforçar):
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 5.5 Manter Software Atualizado

```bash
# Listar pacotes com atualizações de segurança disponíveis
sudo apt list --upgradable

# Verificar se há atualizações pendentes para o kernel
sudo apt list --installed 2>/dev/null | grep linux-image

# Rotina mensal: verificar versões de software crítico
nginx -v
php -v
mysql --version
node -v
```

### 5.6 Checklist de Segurança

- [ ] Chaves SSH configuradas, senha desabilitada
- [ ] Usuário root com login direto bloqueado
- [ ] UFW habilitado com regras mínimas
- [ ] Fail2ban ativo para SSH e serviços web
- [ ] HTTPS com certificados Let's Encrypt
- [ ] Atualizações automáticas de segurança habilitadas
- [ ] Portas desnecessárias fechadas
- [ ] Backups offsite configurados
- [ ] Logs sendo monitorados

---

## 6. Melhorias de Desempenho

### 6.1 Caching

#### OPcache para PHP

O OPcache armazena bytecode PHP compilado na memória, eliminando a necessidade de recompilar scripts a cada requisição.

```ini
# /etc/php/8.3/fpm/conf.d/10-opcache.ini
opcache.enable=1
opcache.memory_consumption=128       # MB de memória para cache
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000  # máximo de arquivos em cache
opcache.revalidate_freq=60           # verificar mudanças a cada 60s
opcache.validate_timestamps=1        # em produção estável, pode ser 0
opcache.save_comments=1
```

#### Redis — Cache de Aplicação

Redis é um armazenamento in-memory ideal para cache de sessões, resultados de queries, e dados temporários.

```bash
sudo apt install redis-server -y
sudo systemctl enable redis-server

# Configurar limite de memória
sudo nano /etc/redis/redis.conf
```
```
maxmemory 512mb
maxmemory-policy allkeys-lru       # evict menos utilizado quando cheio
```
```bash
sudo systemctl restart redis-server

# Testar
redis-cli ping  # resposta: PONG
```

**Uso prático — Cache de sessões PHP com Redis:**
```ini
# /etc/php/8.3/fpm/php.ini
session.save_handler = redis
session.save_path = "tcp://127.0.0.1:6379"
```

#### Nginx — Cache de Proxy

```nginx
# Definir zona de cache (no bloco http em nginx.conf)
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m
                 max_size=1g inactive=60m use_temp_path=off;

# Usar no server block
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_cache app_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_valid 404 1m;
    proxy_cache_use_stale error timeout updating;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### 6.2 Otimização de Banco de Dados

**Identificar queries lentas (MySQL):**
```sql
-- Após habilitar slow_query_log (seção 4.7)
-- Analisar o log:
-- sudo mysqldumpslow /var/log/mysql/slow.log

-- Verificar queries em execução
SHOW PROCESSLIST;

-- Analisar uma query específica
EXPLAIN ANALYZE SELECT * FROM pedidos WHERE status = 'pendente';
```

**Indexação estratégica:**
```sql
-- Criar índice para colunas frequentemente consultadas em WHERE/JOIN
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_data_status ON pedidos(data_criacao, status);

-- Verificar índices existentes
SHOW INDEX FROM pedidos;
```

**Manutenção periódica:**
```sql
-- Otimizar tabelas fragmentadas (MySQL)
OPTIMIZE TABLE pedidos;

-- PostgreSQL: Vacuum e Analyze
VACUUM ANALYZE pedidos;
```

### 6.3 Otimização de Código de Aplicação

| Prática                         | Impacto     | Exemplo                                                  |
|----------------------------------|-------------|----------------------------------------------------------|
| Evitar queries N+1              | Alto        | Usar eager loading / joins em vez de loop de queries     |
| Paginar resultados              | Alto        | `LIMIT/OFFSET` ou cursor-based pagination                |
| Comprimir responses             | Médio       | Gzip habilitado no Nginx (seção 4.5)                     |
| Processar tarefas em background | Alto        | Filas (Redis + worker) para emails, relatórios           |
| Connection pooling              | Médio-Alto  | PgBouncer para PostgreSQL, pool nativo no MySQL          |
| Lazy loading de assets          | Médio       | Carregar imagens e scripts sob demanda                   |

### 6.4 CDN (Content Delivery Network)

**Quando usar:** Sempre que seus usuários estão geograficamente distribuídos ou quando você serve muitos assets estáticos (imagens, CSS, JS, fontes).

**Opções populares:**
- **Cloudflare (gratuito):** Proxy DNS com cache global, proteção DDoS, SSL automático
- **BunnyCDN:** Excelente custo-benefício, latência muito baixa na América do Sul
- **AWS CloudFront:** Integração com S3 para assets estáticos

**Configuração básica com Cloudflare:**
1. Crie conta em [cloudflare.com](https://cloudflare.com)
2. Adicione seu domínio e aponte os nameservers para Cloudflare
3. Configure registros DNS (A record → IP da VPS)
4. Habilite "Proxy" (nuvem laranja) para ativar cache e proteção
5. No Nginx, configure para confiar nos IPs do Cloudflare:
```nginx
# /etc/nginx/conf.d/cloudflare-real-ip.conf
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
real_ip_header CF-Connecting-IP;
```

---

## 7. Casos de Uso Comuns e Exemplos Práticos

### 7.1 Site Institucional / Blog de Médio-Alto Tráfego

**Cenário:** WordPress com 50.000-200.000 visitas/mês.

**Stack recomendada:**
```
Ubuntu 24.04 + Nginx + PHP 8.3-FPM + MariaDB + Redis + Certbot
```

**Distribuição estimada de recursos:**

| Componente    | RAM estimada | Notas                              |
|---------------|-------------|-------------------------------------|
| Nginx         | ~100 MB     | Worker processes + cache            |
| PHP-FPM       | ~500 MB     | Pool com pm.max_children = 10       |
| MariaDB       | ~1.5 GB     | innodb_buffer_pool_size ajustado    |
| Redis         | ~256 MB     | Object cache + sessões              |
| Sistema       | ~500 MB     | Kernel, systemd, logs               |
| **Livre**     | **~5 GB**   | Margem para picos                   |

**Plugins WordPress essenciais para performance com esta stack:**
- Redis Object Cache (conecta WordPress ao Redis)
- Plugin de cache de página (WP Super Cache ou W3 Total Cache)

### 7.2 Aplicação Web (E-commerce, Fórum, Sistema de Gestão)

**Cenário:** Loja virtual com WooCommerce ou sistema customizado em Laravel.

**Stack:**
```
Nginx + PHP 8.3-FPM + MySQL 8 + Redis + Certbot
```

**Ajustes específicos:**
```ini
# PHP-FPM pool — /etc/php/8.3/fpm/pool.d/www.conf
pm = dynamic
pm.max_children = 15
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 6
pm.max_requests = 500        # reciclar processos para evitar memory leaks
```

### 7.3 API RESTful

**Cenário:** API em Node.js servindo um aplicativo mobile com 10.000 usuários ativos.

**Stack:**
```
Nginx (reverse proxy + SSL) → PM2 (cluster mode) → Node.js → PostgreSQL + Redis
```

**Configuração PM2 para produção:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api-prod',
    script: './dist/server.js',
    instances: 2,                // 1 por vCPU
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```
```bash
pm2 start ecosystem.config.js --env production
```

### 7.4 Ambiente de Desenvolvimento / Staging

**Cenário:** Replicar o ambiente de produção para testes antes de deploy.

**Stack com Docker:**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker deploy

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Verificar
docker --version
docker compose version
```

```yaml
# /var/www/staging/docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgres://user:pass@db:5432/staging
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: staging
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru

volumes:
  pgdata:
```

**Nginx como proxy para staging (subdomínio):**
```nginx
server {
    listen 80;
    server_name staging.exemplo.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 7.5 Banco de Dados Dedicado

**Cenário:** Servidor PostgreSQL dedicado acessado por aplicações em outros servidores.

**Configuração para acesso remoto (PostgreSQL):**
```ini
# /etc/postgresql/16/main/postgresql.conf
listen_addresses = '*'           # aceitar conexões de qualquer IP

# /etc/postgresql/16/main/pg_hba.conf (adicionar no final)
# Permitir acesso de IPs específicos
host    all    all    IP_APP_SERVER/32    scram-sha-256
```

**Segurança adicional:**
```bash
# Firewall: permitir porta 5432 apenas para IPs específicos
sudo ufw allow from IP_APP_SERVER to any port 5432 proto tcp comment 'PostgreSQL App Server'
```

### 7.6 Capacidade da KM2 — Visão Consolidada

| Caso de Uso                   | Quantidade Viável | Observações                          |
|-------------------------------|-------------------|--------------------------------------|
| Sites WordPress leves         | 5-10              | Com cache e otimização               |
| Sites WordPress alto tráfego  | 1-3               | Depende das visitas                  |
| APIs Node.js/Python           | 3-5               | Com reverse proxy e PM2/Gunicorn     |
| Containers Docker             | 5-10              | Depende do consumo de cada um        |
| Banco de dados dedicado       | 1                 | Para performance máxima              |
| Ambiente staging completo     | 1-2               | Docker compose com múltiplos serviços|

---

## 8. Recursos Adicionais e Suporte Hostinger

### 8.1 Kodee — Assistente de IA da Hostinger

A Hostinger oferece o **Kodee**, um assistente de IA integrado ao hPanel que pode executar cerca de 200 ações de gerenciamento da VPS:

- Criar snapshots antes de alterações
- Monitorar uso de recursos
- Habilitar scanner de malware e firewall
- Gerenciar acesso SSH e redefinir senhas
- Alterar hostname e configurações DNS
- Gerenciar painéis instalados (cPanel, Plesk)

Para ações destrutivas (reinstalar VPS, restaurar backup, trocar OS), o Kodee solicita confirmação.

**Como acessar:** Ícone do Kodee no canto inferior direito do hPanel.

### 8.2 Templates de Aplicação Pré-instalados

A Hostinger oferece templates prontos que instalam tudo automaticamente:

| Template           | Inclui                                     |
|--------------------|--------------------------------------------|
| WordPress          | Nginx + PHP + MySQL + WordPress            |
| Docker             | Docker + Docker Compose                    |
| cPanel             | cPanel com WHM                             |
| Plesk              | Plesk Web Admin                            |
| Webmin             | Webmin + Virtualmin                        |
| CyberPanel         | LiteSpeed + MariaDB + CyberPanel           |

**Quando usar templates:** São úteis para quem quer começar rápido, mas oferecem menos controle sobre as versões e configurações. Para projetos de produção sérios, a instalação manual (como descrita neste guia) é preferível.

### 8.3 Backups Gerenciados

| Tipo              | Frequência     | Retenção        | Custo                |
|-------------------|----------------|-----------------|----------------------|
| Automático        | Semanal        | 2 mais recentes | Incluído             |
| Diário (upgrade)  | Diário         | 1, 2, 7, 14 dias | Adicional por mês  |
| Snapshot           | Manual         | 1 (20 dias)     | Incluído             |

### 8.4 Contatar o Suporte Hostinger de Forma Eficaz

**Canais disponíveis:**
- **Chat ao vivo 24/7:** Via hPanel (ícone de chat) — o mais rápido
- **Tickets de suporte:** Para questões complexas que precisam de investigação
- **Base de conhecimento:** [support.hostinger.com](https://support.hostinger.com)

**Para respostas mais rápidas e eficazes, inclua na sua mensagem:**

1. **IP da VPS** e **nome do plano** (KM2)
2. **Sistema operacional** instalado
3. **Descrição exata do problema** com passos para reproduzir
4. **Mensagens de erro completas** (copie e cole, não parafraseie)
5. **O que você já tentou** para resolver
6. **Logs relevantes:** Saída de `journalctl -xe` ou logs específicos do serviço

**Exemplo de mensagem eficaz ao suporte:**
> "VPS KM2 (IP: 123.45.67.89), Ubuntu 24.04. Nginx retorna erro 502 desde hoje às 14h.
> O PHP-FPM parou de responder. Já tentei reiniciar com `systemctl restart php8.3-fpm`
> mas o serviço falha novamente após ~5 minutos. Log: `[pool www] server reached pm.max_children setting (5)`."

### 8.5 Referências e Documentação

| Recurso                          | URL                                           |
|----------------------------------|-----------------------------------------------|
| Documentação Hostinger VPS       | https://support.hostinger.com/en/collections/vps |
| Tutoriais VPS Hostinger          | https://www.hostinger.com/tutorials/vps       |
| Ubuntu Server Guide              | https://ubuntu.com/server/docs                |
| Nginx Docs                       | https://nginx.org/en/docs/                    |
| MySQL 8 Reference                | https://dev.mysql.com/doc/refman/8.0/en/      |
| PostgreSQL Docs                  | https://www.postgresql.org/docs/              |
| Let's Encrypt                    | https://letsencrypt.org/docs/                 |
| Fail2ban Wiki                    | https://github.com/fail2ban/fail2ban/wiki     |

---

## Referência Rápida — Comandos Mais Usados

```bash
# === SISTEMA ===
sudo apt update && sudo apt upgrade -y    # atualizar pacotes
htop                                       # monitorar CPU/RAM
df -h                                      # espaço em disco
free -h                                    # uso de memória
uptime                                     # carga do sistema

# === SERVIÇOS ===
sudo systemctl status nginx                # verificar status
sudo systemctl restart php8.3-fpm          # reiniciar serviço
sudo systemctl enable mysql                # habilitar na inicialização
sudo journalctl -u nginx -f                # logs em tempo real

# === FIREWALL ===
sudo ufw status verbose                    # regras ativas
sudo ufw allow 443/tcp                     # abrir porta
sudo ufw deny 3306/tcp                     # fechar porta

# === SEGURANÇA ===
sudo fail2ban-client status sshd           # IPs banidos
sudo certbot renew --dry-run               # testar renovação SSL

# === NGINX ===
sudo nginx -t                              # testar configuração
sudo systemctl reload nginx                # aplicar mudanças sem downtime

# === BANCO DE DADOS ===
mysqldump -u root -p meu_banco > backup.sql      # backup MySQL
pg_dump -U postgres meu_banco > backup.sql        # backup PostgreSQL

# === DIAGNÓSTICO ===
sudo tail -f /var/log/nginx/error.log      # erros do Nginx
sudo tail -f /var/log/syslog               # log geral do sistema
ss -tlnp                                   # portas em escuta
```

---

*Guia elaborado para a VPS KM2 da Hostinger com especificações de Março/2026. As versões de software e comandos assumem Ubuntu 24.04 LTS como sistema operacional.*
