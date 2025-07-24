const express = require('express');
const app = express();
const PORT = 3000;

console.log('🚀 Starting test server...');

app.get('/', (req, res) => {
    res.send('Email Intelligence Server is running!');
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log('📊 Email Intelligence Pipeline ready for testing');
});
