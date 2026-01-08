import express, { Router } from 'express';

export const initServer = async (router: Router, port = 3002) => {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    app.use(router);
    app.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Listening on port 3002');
        resolve(app);
      }
    });
  });
};
