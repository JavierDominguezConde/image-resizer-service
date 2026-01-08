db = db.getSiblingDB('resizer');

db.tasks.insertMany([
  {
    taskId: 'b40484f0-adb9-4881-a100-2faa71082766',
    origin: { url: 'https://picsum.photos/1920/1080' },
    price: 23.4,
    status: 'pending',
    createdAt: '2026-01-07T02:00:00',
    updatedAt: '2024-01-07T02:10:00'
  },
  {
    taskId: 'cea472cf-9a0a-4abb-b335-47aebf9846bb',
    origin: { path: '/output/test-image.png' },
    price: 19.0,
    status: 'failed',
    error: {
      code: 'STORAGE_ERROR',
      message: 'There was an error with the storage'
    },
    createdAt: '2026-01-07T02:00:00',
    updatedAt: '2024-01-07T02:10:00'
  }
]);
