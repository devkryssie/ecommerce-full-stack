import app from "./app.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown and unhandled promise/error handler
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
});
