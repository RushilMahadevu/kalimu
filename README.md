# Kalimu (in production)

<img src="https://cdn-icons-png.flaticon.com/512/7329/7329446.png" alt="Notepad Icon" width="100"/>

> Icon by [Flaticon](https://www.flaticon.com/free-icon/notepad_7329446)

## Overview

Kalimu is an AI-powered educational platform designed to support high school students throughout their academic journey. By integrating artificial intelligence, we provide comprehensive assistance with academic planning, college preparation, student life, and personal development.

## System Architecture

```mermaid
graph TD
    A[Kalimu] --> B[College Selection]
    A --> C[Academic Planning]
    A --> D[Student Life]
    A --> E[Personal Development]

    B --> B1[College Matcher]
    B --> B2[Admission Tips]
    B --> B3[Scholarship Finder]
    B --> B4[Common App Helper]
    B --> B5[College Visit Planner]

    C --> C1[Course Selection Helper]
    C --> C2[GPA Calculator & Tracker]
    C --> C3[Study Schedule Optimizer]
    C --> C4[Homework Manager]
    C --> C5[Test Prep Assistant]
    C --> C6[Academic Progress Tracker]

    D --> D1[Club & Activity Recommender]
    D --> D2[Sports Management]
    D --> D3[Volunteer Opportunity Finder]
    D --> D4[Leadership Development]
    D --> D5[Competition Tracker]

    E --> E1[Career Interest Explorer]
    E --> E2[Summer Program Finder]
    E --> E3[Skill Development Path]
    E --> E4[Mental Health Resources]
    E --> E5[Time Management Coach]

    classDef default fill:#6a0dad,stroke:#4b0082,stroke-width:2px;
    class A,B,C,D,E default;

```

## Features

### `🎓 College Preparation`

- **College Matcher:** Personalized college recommendations
- **Admission Tips:** Strategic guidance for college applications
- **Scholarship Finder:** Comprehensive scholarship database and matching
- **Common App Helper:** Step-by-step application assistance
- **College Visit Planner:** Campus visit organization tools

### `📚 Academic Planning`

- **Course Selection Helper:** Smart course recommendations based on interests and requirements
- **GPA Calculator & Tracker:** Real-time GPA monitoring and forecasting
- **Study Schedule Optimizer:** AI-powered study planning
- **Homework Manager:** Assignment tracking and deadline management
- **Test Prep Assistant:** Personalized test preparation support
- **Academic Progress Tracker:** Graduation requirement monitoring

### `🌟 Student Life`

- **Club & Activity Recommender:** Personalized extracurricular suggestions
- **Sports Management:** Athletic activity tracking
- **Volunteer Opportunity Finder:** Service opportunity matching
- **Leadership Development:** Leadership role identification
- **Competition Tracker:** Academic competition management

### `🚀 Personal Development`

- **Career Interest Explorer:** Early career guidance
- **Summer Program Finder:** Enrichment opportunity matching
- **Skill Development Path:** Customized learning roadmaps
- **Mental Health Resources:** Wellness support and resources
- **Time Management Coach:** Schedule optimization tools


## Tech Stack  

### **AI Engine**
- **Google’s Gemini API**  
```javascript
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
```
- **Prompt Engineering (Ex. from `Admission Tips`)**
``` js
const prompt = `
As an expert college admissions counselor, provide 5 highly personalized 
and strategic admission tips based on this student profile:
- GPA: ${profile.gpa}
- Test Scores: ${profile.testScores}
- Extracurricular Activities: ${profile.extracurriculars}
- Academic Interest: ${profile.academicInterest}
- Challenged Background: ${profile.challengedBackground}

For each tip, provide:
1. Specific, actionable advice
2. Rationale behind the recommendation
3. Potential impact on college applications

Respond in a strict JSON format with these exact keys:
[
  {
    "tipTitle": "",
    "tipDescription": "",
    "strategicRationale": "",
    "potentialImpact": ""
  }
]

Ensure tips are highly specific and tailored to the student's unique profile.
`;
```

### **Frontend**
- **JavaScript**  
  - React.js: Combines HTML and JavaScript using JSX (JavaScript XML).
- **Color Theme**
```css
:root {
  --primary-color: #6a5acd; /* Slate Purple */
  --secondary-color: #36454f; /* Charcoal Gray */
  --background-color: #1e1e2c; /* Deep Space Blue */
  --text-color: #e6e6fa; /* Lavender */
  --accent-color: #8a2be2; /* Blue Violet */
}
```

### **Backend**
- **Firebase**
    - **🪪 Authentication**
    - **🌐 Hosting**
    - **🛢️ Firestore Database**
    - **📦 Storage**
      
    - **Config**
    ```js
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };
    ```
---

## Getting Started  

Coming soon...  

---

## Contributing  

Coming soon...  

---

## License  

Coming soon...  

---

**Made with ❤️ for students.**  
