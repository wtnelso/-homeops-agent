const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Test server is working!');
});

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});
