import app from "./app.js";

const PORT = process.env.GATEWAY_PORT || 5000;

const startServer = async () => {
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
