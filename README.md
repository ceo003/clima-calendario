# Clima & Calendário

Uma aplicação web simples que exibe informações climáticas e um calendário visual.

## Recursos

### Clima
- Busca de temperatura e condições climáticas para qualquer cidade
- Detecção automática da localização do usuário para mostrar o clima local
- Exibição de detalhes como temperatura atual, sensação térmica, umidade e velocidade do vento

### Calendário
- Visualização de calendário mensal
- Navegação entre meses
- Marcação do dia atual
- Seleção de datas

## Configuração

### Pré-requisitos
- Um navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexão com a internet para buscar dados climáticos

### Obtenção de uma chave de API para OpenWeatherMap
1. Visite [OpenWeatherMap](https://openweathermap.org/) e crie uma conta gratuita
2. Depois de criar a conta, acesse a seção "API Keys" em seu perfil
3. Crie uma nova chave API ou use a chave padrão fornecida
4. Copie a chave API

### Configuração da aplicação
1. Abra o arquivo `script.js` em seu editor de código
2. Substitua o valor da constante `WEATHER_API_KEY` com sua chave API:
   ```javascript
   const WEATHER_API_KEY = 'SUA_CHAVE_API_AQUI';
   ```

## Como usar

### Execução local
1. Clone ou baixe os arquivos para seu computador
2. Abra o arquivo `index.html` em um navegador web

### Funcionalidades do clima
- Digite o nome de uma cidade na caixa de pesquisa e clique no botão de busca ou pressione Enter
- Clique no botão "Usar minha localização" para detectar automaticamente sua localização atual
- Veja os detalhes climáticos exibidos no cartão de clima

### Funcionalidades do calendário
- Navegue entre os meses utilizando as setas à esquerda e à direita
- Clique em "Hoje" para voltar ao mês atual e destacar o dia atual
- Clique em qualquer dia para selecioná-lo

## Suporte para dispositivos móveis
- A aplicação é totalmente responsiva e funciona bem em dispositivos móveis e desktops

## Tecnologias utilizadas
- HTML5
- CSS3 (com variáveis CSS e Grid Layout)
- JavaScript (ES6+)
- API OpenWeatherMap
- Geolocation API

## Limitações
- A versão gratuita da API OpenWeatherMap tem um limite de requisições por minuto/dia
- A detecção de localização requer permissão do usuário e pode não funcionar em todos os navegadores
- O calendário não salva eventos ou compromissos (apenas exibição visual)

## Sugestões de melhorias futuras
- Adicionar previsão do tempo para os próximos dias
- Implementar sistema de persistência para eventos no calendário
- Adicionar temas claro/escuro
- Implementar múltiplas unidades de temperatura (Celsius/Fahrenheit) 


Ass. Gemilson.PRIVADO.CEO"# clima-calendario" 
