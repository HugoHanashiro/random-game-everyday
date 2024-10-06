import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import axios from 'axios';

const BLUESKY_USERNAME: string = "randomgameeveryday.bsky.social"
const BLUESKY_PASSWORD: string = "rj2g-ncx2-cqfb-fpd7"
const API_KEY: string = "5b06bc2830814ff68b37e463110cdf72"

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
    const urlCount: string = `https://api.rawg.io/api/games?key=${API_KEY}`
    const responseCount = await axios.get(urlCount);
    const count: number = responseCount.data.count;

    const randomNumber: number = Math.floor(Math.random() * count) + 1;
    const url: string = `https://api.rawg.io/api/games/${randomNumber}?key=${API_KEY}`

    let response;
    let status;
    do {
        response = await axios.get(url);
        status = response.status;
    } while (status !== 200);

    const foundGame: Game = {
        id: response.data.id,
        name: response.data.name_original,
        image_url: response.data.background_image ? response.data.background_image : null
    }
    return foundGame;
}

async function main() {
    const game = await getRandomGame();
    await agent.login({ identifier: BLUESKY_USERNAME, password: BLUESKY_PASSWORD })

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
const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
// const scheduleExpression = '0 23 * * *'; // Run once every three hours in prod

const job = new CronJob(scheduleExpressionMinute, main); // change to scheduleExpressionMinute for testing

job.start();

// main();

console.log("Está rodando")