const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); 

function base64Encode(str) {
  return Buffer.from(str).toString('base64');
}

router.post('/run-code', async (req, res) => {

  const { code, language, input } = req.body;

  const languageMap = {
    javascript: 63,
    python: 71,
    java: 62,
    c: 50,
    cpp: 54,
  };

  const languageId = languageMap[language] || 63;

  try {
    const response = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false&fields=*",
      {
        method: "POST",
        headers: {
          "x-rapidapi-key": process.env.JUDGE0_API_KEY,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language_id: languageId,
          source_code: base64Encode(code),
          stdin: base64Encode(input || " "),
        }),
      }
    );

    const responseData = await response.json();
    const token = responseData.token;

    if (!token) {
      console.error("Judge0 submission failed:", responseData);
      return res.status(500).json({ message: "Failed to create submission with Judge0." });
    }

    const url = `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*`;
    const headers = {
      "x-rapidapi-key": process.env.JUDGE0_API_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    };

    let result = null;
    let retries = 20;
    while (retries--) {
      const pollRes = await fetch(url, { headers });
      const data = await pollRes.json();

      if (data.status?.id <= 2) {
        
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        result = data;
        break;
      }
    }

    if (!result) {
      return res.status(504).json({ message: "Timeout polling Judge0 for results." });
    }

    const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf-8') : "";
    const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString('utf-8') : "";
    const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString('utf-8') : "";

    res.status(200).json({
      stdout,
      stderr,
      compile_output: compileOutput,
      status: result.status,
    });
  } catch (error) {
    console.error("Error running code:", error);
    res.status(500).json({ message: "Internal server error during code execution." });
  }
});

module.exports = router;
