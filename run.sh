#!/bin/bash

# Ensure npm is in PATH (common for nvm setups in this environment)
export PATH=$PATH:/home/amadou/.local/share/nvm/v24.13.0/bin

echo "Installation des dépendances (si nécessaire)..."
if command -v npm >/dev/null 2>&1; then
    npm install --silent
else
    echo "Erreur : npm n'est toujours pas trouvé. Vérifiez votre installation de Node.js."
    exit 1
fi

echo "Lancement du serveur de développement sur le port 5173..."
npm run dev -- --host 0.0.0.0 --port 5173
