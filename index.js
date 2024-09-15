"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@atproto/api");
const dotenv = __importStar(require("dotenv"));
const cron_1 = require("cron");
const process = __importStar(require("process"));
const axios_1 = __importDefault(require("axios"));
dotenv.config();
// Create a Bluesky Agent 
const agent = new api_1.BskyAgent({
    service: 'https://bsky.social',
});
async function getRandomGame() {
    const randomNumber = Math.floor(Math.random() * 873353) + 1;
    const url = `https://api.rawg.io/api/games/${randomNumber}?key=${process.env.API_KEY}`;
    const response = await axios_1.default.get(url);
    const foundGame = {
        id: response.data.id,
        name: response.data.name_original,
        image_url: response.data.background_image ? response.data.background_image : null
    };
    return foundGame;
}
async function main() {
    const game = await getRandomGame();
    await agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD });
    const imageUrl = game.image_url;
    if (imageUrl) {
        const imageResponse = await axios_1.default.get(imageUrl, { responseType: 'arraybuffer' }); // Get image data as an arraybuffer
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
    }
    else {
        await agent.post({
            text: `${game.name} (no image available)`
        });
    }
    console.log("Just posted!");
}
// // Run this on a cron job
// const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 23 * * *'; // Run once every three hours in prod
const job = new cron_1.CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing
job.start();
console.log("Está rodando");
