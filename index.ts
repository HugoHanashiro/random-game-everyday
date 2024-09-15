import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import axios from 'axios';

dotenv.config();

// Create a Bluesky Agent 
const agent = new BskyAgent({
    service: 'https://bsky.social',
})

interface Game {
    id: number,
    name: string,
    image_url: string | null
}

async function getRandomGame() {
    const randomNumber: number = Math.floor(Math.random() * 873353) + 1;
    const url: string = `https://api.rawg.io/api/games/${randomNumber}?key=${process.env.API_KEY!}`
    const response = await axios.get(url);
    const foundGame: Game = {
        id: response.data.id,
        name: response.data.name_original,
        image_url: response.data.background_image ? response.data.background_image : null
    }
    return foundGame;
}

async function main() {
    const game = await getRandomGame();
    await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD! })

    const imageUrl = game.image_url;

    if (imageUrl) {
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' }); // Get image data as an arraybuffer
        const imageData = new Uint8Array(imageResponse.data); // Convert to Uint8Array

        const { data } = await agent.uploadBlob(imageData, { encoding: 'image/jpeg' }); // Assuming the image is jpeg

        const embed = {
            $type: 'app.bsky.embed.images',
            images: [
                {
                    alt: `Image of the game ${game.name}`,
                    image: data.blob,
                    aspectRatio: {
                        width: 1200, // Adjust as needed based on typical image size
                        height: 675, // Adjust as needed based on typical image size
                    },
                },
            ],
        };

        await agent.post({
            text: game.name,
            embed,
        });
    } else {
        await agent.post({
            text: `${game.name} (no image available)`
        });
    }
    console.log("Just posted!");
}

// // Run this on a cron job
// const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 0 * * *'; // Run once every three hours in prod

const job = new CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing

job.start();

console.log("Está rodando")