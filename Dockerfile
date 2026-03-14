# Étape de construction
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copie des fichiers de configuration
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste des fichiers source
COPY . .

# Construction du projet
RUN npm run build

# Étape de production
FROM nginx:stable-alpine AS production-stage

# Copie des fichiers compilés depuis l'étape de build vers Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copie d'une configuration Nginx personnalisée si nécessaire (optionnel)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
