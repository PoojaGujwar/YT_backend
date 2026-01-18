import express, { response } from "express";
import { google } from "googleapis";
import dotenv from "dotenv"
dotenv.config()

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  `http://localhost:${process.env.PORT}/auth/google/callback`
);

router.get("/auth/google", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube"],
  });

  res.redirect(url);
});

router.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  global.oauthTokens = tokens;
  res.cookie("oauthToken", JSON.stringify(tokens), {
    httpOnly: true
  });

  res.redirect("http://localhost:3000/dashboard");
});

router.get("/videos", async (req, res) => {
  console.log("YOUTUBE",req.cookies)
  try {
    const token = req.cookies.oauthToken;

console.log("Token",token)
if (!token) {
      return res.json({
        id: "mock-video-id",
        snippet: {
          title: "My First YouTube Video (Mock)",
          description: "This is a mock description until YouTube access is restored"
        }
      });
    }


    // ✅ token set karo
    oauth2Client.setCredentials(JSON.parse(token));

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client
    });
   const response = await youtube.search.list({
  part: "snippet",
  forMine: true,
  type: "video",
  maxResults: 5
});

console.log(response.data.items[0])
    res.json(response.data.items[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/videos/:id/comment",async(req,res)=>{
  const {text} = req.body
  try {
    oauth2Client.setCredentials(JSON.parse(req.cookies.oauthToken))
    const youtube = google.youtube({version:3,auth:oauth2Client})
    const response = await youtube.commentThreads.insert({
      part:"snippet",
      requestBody:{
        snippet:{
          videoId:req.params.id,
          topLevelComment:{
            snippet:{textOriginal:text}
          }
        }
      }
    })
    res.json(response.data)
  } catch (error) {
    res.status(500).json({error:"Internal Server error",error})
  }
})
router.put("/videos/:id",async(req,res)=>{
  const {title, description} = req.body
  try {
    oauth2Client.setCredentials(JSON.parse(req.cookies.oauthToken))
    const youtube = google.youtube({version:"v3",auth:oauth2Client})
    const response = await youtube.videos.update({
      part:"snippet",
      requestBody:{
        id: req.params.id,
        snippet:{title, description}
      }
    });
    res.json(response.data)
  } catch (error) {
    res.status(500).json({error:error.message})
  }
})



export default router
