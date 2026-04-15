#  AI Collaborative Code Editor (CodeMate)

A **real-time collaborative code editor** that allows multiple users to write, edit, and execute code together instantly from the browser. Built using modern technologies like **Next.js, Socket.IO, Monaco Editor, Judge0 API, and Gemini AI**.

This project is ideal for **pair programming, coding interviews, collaborative learning, and team-based development**.

---

##  Features

###  Real-Time Collaboration

* Join shared coding rooms using Room ID
* Live code synchronization between users
* User join notifications

###  Multi-Language Code Execution

* Execute code directly inside the editor
* Supports multiple programming languages
* Handles user input (stdin)
* Powered by Judge0 API

###  AI Coding Assistant

* Ask coding-related questions
* Get explanations and suggestions
* Improve productivity while coding
* Powered by Gemini API

###  Professional Editor Experience

* Monaco Editor (VS Code-like interface)
* Syntax highlighting
* Fast editing experience
* Responsive UI

###  Room-Based Workflow

* Create or join rooms instantly
* Share Room ID with teammates
* Copy Room ID feature

---

##  Tech Stack

### Frontend

* Next.js (App Router)
* React
* Tailwind CSS
* Monaco Editor
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO Server

### APIs Used

* Judge0 API (code execution)
* Gemini API (AI assistant)

---

##  Installation Guide

###  Clone Repository

```
git clone https://github.com/TheAihtesham/ai-collaborative-code-editor.git
```

---

###  Install Dependencies

Frontend:

```
cd client
npm install
```

Backend:

```
cd server
npm install
```

---

##  Run Project Locally

Start backend server:

```
cd server
npm run dev
```

Start frontend:

```
cd client
npm run dev
```

Open in browser:

```
http://localhost:3000
```

---

##  Environment Variables Setup

Create a `.env` file inside the **server folder**

```
PORT=5000
JUDGE0_API_KEY=your_judge0_api_key
GEMINI_API_KEY=your_gemini_api_key
```

---

##  How It Works

1. User creates or joins a room
2. Socket.IO establishes connection between users
3. Code changes sync instantly
4. Cursor positions update in real time
5. Judge0 executes code securely
6. Gemini AI answers coding questions

---

##  Screenshots
<img width="1263" height="611" alt="image" src="https://github.com/user-attachments/assets/428f0939-ad90-4529-a6f2-4fc44b728387" />

<img width="1354" height="614" alt="image" src="https://github.com/user-attachments/assets/02aff646-311f-4d64-a0e9-fbc87afc5201" />


---

##  Contributing

Contributions are welcome!

Steps:

```
Fork the repository
Create your feature branch
Commit your changes
Push to your branch
Open a Pull Request
```

---

##  License

This project is licensed under the MIT License.

---

##  Author

**Aihtesham**

GitHub:
https://github.com/TheAihtesham

---

