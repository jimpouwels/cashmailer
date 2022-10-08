import { config } from 'dotenv';
import path from 'path';

config({
    path: path.join(process.cwd(), `.env`)
});

export default config;