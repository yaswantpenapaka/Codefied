const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();

const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_GEMINI_API_KEY});

const aiCodereview = async (code) => {
    const interaction = await ai.interactions.create({
  model: "gemini-3.5-flash",
  input: `Review the following code and provide feedback : ${code}`,
});
//console.log(interaction.output_text);
return interaction.output_text;
};


module.exports = {aiCodereview,};