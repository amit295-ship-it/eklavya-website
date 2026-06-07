export function initChatbot() {
  const toggleBtn = document.getElementById("chatbot-toggle");
  const chatWindow = document.getElementById("chatbot-window");
  const closeBtn = document.getElementById("chatbot-close");
  const messagesContainer = document.getElementById("chatbot-messages");
  const voiceToggleBtn = document.getElementById("voice-toggle");
  const avatar = document.getElementById("sahyog-avatar");
  const chatInput = document.getElementById("chatbot-input") as HTMLInputElement | null;
  const chatSendBtn = document.getElementById("chatbot-send-btn");

  let voiceEnabled = false;
  let voices: SpeechSynthesisVoice[] = [];
  
  // Set up Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  let recognition: any = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (chatInput) {
        chatInput.value = transcript;
        submitChat();
      }
    };
  }

  // Ensure voices are loaded
  function loadVoices() {
    voices = window.speechSynthesis.getVoices();
  }
  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  if (!toggleBtn || !chatWindow || !closeBtn || !messagesContainer || !voiceToggleBtn || !avatar) return;

  const villageBoyPopup = document.getElementById("village-boy-popup");

  voiceToggleBtn.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    voiceToggleBtn.classList.toggle("active", voiceEnabled);
    if (!voiceEnabled) {
      window.speechSynthesis.cancel();
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
      }
      villageBoyPopup?.classList.add("hidden");
    } else {
      speakText("Voice mode enabled. I am listening.");
    }
  });

  // Keep a reference to utterances to prevent garbage collection bugs in some browsers
  const activeUtterances: SpeechSynthesisUtterance[] = [];

  function speakText(text: string) {
    if (!voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // stop previous speech
    activeUtterances.length = 0;
    
    // Strip HTML tags for clean speech
    const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtterances.push(utterance);
    
    // Try to find an Indian English voice
    const indianVoice = voices.find(v => v.lang === "en-IN") || voices.find(v => v.name.includes("India"));
    if (indianVoice) utterance.voice = indianVoice;
    
    utterance.onstart = () => {
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
      }
      villageBoyPopup?.classList.remove("hidden");
    };
    
    utterance.onend = () => {
      villageBoyPopup?.classList.add("hidden");
      if (voiceEnabled && recognition) {
        try { recognition.start(); } catch(e) {}
      }
    };

    utterance.onerror = () => {
      villageBoyPopup?.classList.add("hidden");
      if (voiceEnabled && recognition) {
        try { recognition.start(); } catch(e) {}
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }

  // Use a timeout reference to clear previous hide timers if the bot speaks multiple times
  let popupTimeout: number | undefined;

  function triggerConversingPopup(durationMs: number) {
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
    villageBoyPopup?.classList.remove("hidden");
    popupTimeout = window.setTimeout(() => {
      villageBoyPopup?.classList.add("hidden");
    }, durationMs);
  }

  toggleBtn.addEventListener("click", () => {
    chatWindow.classList.toggle("hidden");
    if (!chatWindow.classList.contains("hidden") && messagesContainer.children.length === 0) {
      startConversation();
    }
  });

  closeBtn.addEventListener("click", () => {
    chatWindow.classList.add("hidden");
  });

  function scrollToBottom() {
    if (!messagesContainer) return;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Set scroll position after small delays for animation render cycles
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 150);
  }

  function addMessage(text: string, sender: "bot" | "user") {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${sender}-message`;
    msgDiv.innerHTML = text;
    messagesContainer?.appendChild(msgDiv);
    
    scrollToBottom();
    
    // Auto-scroll when any images within the chat message load (like the founder avatar)
    const imgs = msgDiv.querySelectorAll("img");
    imgs.forEach(img => {
      img.onload = () => scrollToBottom();
    });
    
    if (sender === "bot") {
      // Clean text to calculate reading time roughly
      const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
      
      if (voiceEnabled) {
        speakText(text);
      } else {
        // If voice is off, show the popup for an estimated reading time (approx 250 ms per word)
        const wordsCount = cleanText.split(/\s+/).length;
        const duration = Math.min(Math.max(wordsCount * 250, 2000), 8000); // Between 2s and 8s max
        triggerConversingPopup(duration);
      }
    }
  }

  function addOptions(options: { text: string; onClick: () => void }[]) {
    const optionsDiv = document.createElement("div");
    optionsDiv.className = "chat-options";
    
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "chat-option-btn";
      btn.textContent = opt.text;
      btn.onclick = () => {
        addMessage(opt.text, "user");
        optionsDiv.remove(); // Remove options once selected
        opt.onClick();
      };
      optionsDiv.appendChild(btn);
    });

    messagesContainer?.appendChild(optionsDiv);
    scrollToBottom();
  }

  function showMenuHelper() {
    addOptions([
      {
        text: "☰ Show Main Menu",
        onClick: () => {
          showMainMenu();
        }
      }
    ]);
  }

  function startConversation() {
    addMessage("Namaste and welcome to Sahyog 🌟<br>The assistant of Eklavya Career Initiative.<br><br>No barriers. Just belief. Be Eklavya.<br><br>How may I guide you today?", "bot");
    showMainMenu();
  }

  function showMainMenu() {
    addOptions([
      {
        text: "📖 About Us",
        onClick: () => {
          addMessage("<strong>Our Mission</strong><br>We believe talent exists everywhere, but opportunity does not. We aim to bridge that gap through mentorship, skill development, and accessible career resources to help the determined become the exceptional.", "bot");
          addMessage("Inspired by the legendary archer <strong>Eklavya</strong>, our motto is:<br><br><em>'No barriers. Just belief. Be Eklavya.'</em>", "bot");
          showMenuHelper();
        }
      },
      {
        text: "🎯 Explore our programs",
        onClick: () => {
          addMessage("We have several wonderful programs designed to empower individuals:", "bot");
          addMessage(`
            <ul>
              <li><strong>Support a Child Build a Dream:</strong> Fee sponsorships for school/college/competitive exams.</li>
              <li><strong>Samvaad se Safalta:</strong> 52-week spoken English mentoring (1-on-1 virtual sessions).</li>
              <li><strong>Love Your Career, Mould Your Career:</strong> Extensive career counseling, resume building, and mock interviews.</li>
              <li><strong>Skilling to Learn:</strong> Vocational training in Advanced Excel, Data Analytics, and Agile.</li>
              <li><strong>AI Internship & Practitioner Programs:</strong> Curated batch-based programs for students (AI Internship) and working professionals (AI Practitioner). Mentored by MCT Amit Kumar Gupta, covering layman AI/ML/DL, data science, use cases (Netflix, YouTube, D-Mart, crop & Digit car insurance), LLM architectures, Agentic AI, custom GPTs, and RAG tools (using notebooks, Claude skills, and artifacts). Contact us on WhatsApp to know more!</li>
              <li><strong>Expert Lectures & Workshops:</strong> Scrum certifications, Advanced Excel, Financial Literacy, and Digital Transformation.</li>
            </ul>
            <p>You can read the full details in our <a href="#" onclick="document.querySelector('.programs-section').scrollIntoView({behavior: 'smooth'})">Programs Section</a>.</p>
            <p><em>We are proud to partner with Connect Shiksha, Cubicle Buddies, SYJ Roots, Sahara Society, and Naxlogic.</em></p>
          `, "bot");
          showMenuHelper();
        }
      },
      {
        text: "👨‍🏫 Know about the founder",
        onClick: () => {
          addMessage(`<img src="/founder pic.webp" alt="Amit Kumar Gupta" style="width:100%; border-radius:8px; margin-bottom:8px;">Eklavya Career Initiative was founded by <strong>Amit Kumar Gupta</strong>.`, "bot");
          addMessage("He is an IT Strategy Consultant, Digital Transformation Expert, and Microsoft Certified Trainer with 18+ years of experience. He is a passionate mentor and career counselor who has conducted workshops across schools, colleges, and universities.", "bot");
          addMessage(`<a href="https://www.linkedin.com/in/amit-kumar-gupta-33464010/" target="_blank" class="chat-link-btn">💼 View LinkedIn Profile</a>`, "bot");
          showMenuHelper();
        }
      },
      {
        text: "📞 Contact Us",
        onClick: () => {
          addMessage("We would love to hear from you! You can reach us through any of the following channels:", "bot");
          addMessage(`
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
              <a href="https://wa.me/917899577788" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);">💬 WhatsApp Us</a>
              <a href="mailto:eklavyacareerinitiative@gmail.com" class="chat-link-btn" style="background: linear-gradient(135deg, #EA4335 0%, #C33223 100%);">📧 Email Us</a>
              <a href="https://www.linkedin.com/company/eklavya-career-initiative/?viewAsMember=true" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #0077b5 0%, #005885 100%);">💼 LinkedIn</a>
              <a href="https://www.instagram.com/eklavyainitiative?igsh=em1mazFnOXd2c3Nn" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #e4405f 0%, #833ab4 100%);">📷 Instagram</a>
              <a href="https://g.page/r/CQ84hAOd5HNNEAE/review" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #4285F4 0%, #34A853 100%);">⭐ Write a Google Review</a>
              <a href="#" onclick="document.getElementById('contact-form-anchor').scrollIntoView({behavior: 'smooth'})" class="chat-link-btn">📝 Contact Form</a>
              <a href="https://forms.gle/gdNgDkvLonB4DPUH6" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #673AB7 0%, #512DA8 100%);">📋 Open Form in New Tab</a>
            </div>
          `, "bot");
          showMenuHelper();
        }
      }
    ]);
  }

  function handleUserMessage(msg: string) {
    const text = msg.toLowerCase();
    let response = "";

    if (text.includes("whatsapp") || text.includes("contact") || text.includes("chat") || text.includes("talk") || text.includes("reach") || text.includes("email")) {
      response = `<strong>Contact & Connect with Eklavya 📞</strong><br><br>
      The fastest and most direct way to get in touch with us is through **WhatsApp**! Since we schedule classes and counseling based on cohort numbers, we would love to chat with you there:<br><br>
      <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem;">
        <a href="https://wa.me/917899577788" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); text-align: center; margin: 0;">💬 Chat on WhatsApp</a>
        <a href="mailto:eklavyacareerinitiative@gmail.com" class="chat-link-btn" style="background: linear-gradient(135deg, #EA4335 0%, #C33223 100%); text-align: center; margin: 0;">📧 Email Us directly</a>
      </div>
      <br><strong>Other details:</strong><br>
      - WhatsApp/Phone: +91 7899577788<br>
      - WhatsApp Channel: https://whatsapp.com/channel/0029VbCNimtHrDZkR7wx7T2e<br>
      - Email: eklavyacareerinitiative@gmail.com<br>
      - Address/Form inquiries: You can also use the contact form at the bottom of the page!`;
    } 
    else if (text.includes("support") || text.includes("child") || text.includes("dream") || text.includes("sponsor") || text.includes("fee") || text.includes("scholarship")) {
      response = `<strong>Support a Child Build a Dream 🎓</strong><br><br>
      This program provides critical education sponsorships and financial support to ensure that economic constraints do not prevent needy yet talented students from realizing their academic potential.<br><br>
      <strong>What We Cover:</strong><br>
      <ul>
        <li>School tuition and monthly academic fees.</li>
        <li>Undergraduate (UG) and Postgraduate (PG) college fees.</li>
        <li>Registration and training fees for competitive exams.</li>
        <li>Necessary educational learning resources.</li>
      </ul>
      If you are a student seeking sponsorship, or if you wish to volunteer or support this program, please fill out our contact form or get in touch with us!<br><br>
      <a href="#contact-form-anchor" onclick="document.getElementById('contact-form-anchor').scrollIntoView({behavior: 'smooth'})" class="chat-link-btn" style="text-align: center; display: block; margin-top: 0.5rem;">📝 Request Support / Sponsor</a>`;
    }
    else if (text.includes("samvaad") || text.includes("safalta") || text.includes("english") || text.includes("speak") || text.includes("communicat")) {
      response = `<strong>Samvaad Se Safalta (Spoken English Mentoring) 💬</strong><br><br>
      A structured, highly popular <strong>52-week communication program</strong> designed to build conversational fluency, public speaking confidence, and active listening skills through personalized mentoring.<br><br>
      <strong>Key Features:</strong><br>
      <ul>
        <li><strong>1-on-1 Virtual Sessions:</strong> Weekly 30-minute virtual meetings with an experienced mentor.</li>
        <li><strong>Conversational Approach:</strong> Focuses on practical speaking, eliminating hesitations, and building vocabulary without complex grammar rules.</li>
        <li><strong>Long-term Support:</strong> Runs for a full year (52 weeks) to ensure permanent habit formation and confidence.</li>
      </ul>
      Since batches are limited by volunteer availability, cadets are admitted based on assessment. Connect with us on WhatsApp to inquire about the next induction batch!<br><br>
      <a href="https://wa.me/917899577788?text=Hello,%20I'm%20interested%20in%20knowing%20more%20about%20Samvaad%20Se%20Safalta." target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); text-align: center; display: block; margin-top: 0.5rem;">💬 Inquire about Samvaad se Safalta</a>`;
    }
    else if (text.includes("love your career") || text.includes("counsel") || text.includes("mould") || text.includes("interview") || text.includes("resume") || text.includes("guidance") || text.includes("job")) {
      response = `<strong>Love Your Career, Mould Your Career 💡</strong><br><br>
      Our comprehensive career guidance and job readiness program helping school students and active job seekers navigate their career paths with clarity.<br><br>
      <strong>Services Offered:</strong><br>
      <ul>
        <li><strong>Counseling for Grades IX to XII:</strong> Guidance on choosing academic streams and mapping undergraduate/postgraduate options.</li>
        <li><strong>Resume Building Workshops:</strong> Creating impactful, professional resumes that clear automated screening (ATS).</li>
        <li><strong>Mock Interviews:</strong> Realistic mock interviews with experienced corporate volunteers to build confidence and refine interview answers.</li>
        <li><strong>Job Hunting Strategies:</strong> Focused sessions on LinkedIn search, networking, and cold outreach techniques.</li>
      </ul>
      <a href="#contact-form-anchor" onclick="document.getElementById('contact-form-anchor').scrollIntoView({behavior: 'smooth'})" class="chat-link-btn" style="text-align: center; display: block; margin-top: 0.5rem;">📝 Get Career Counseling</a>`;
    }
    else if (text.includes("ai") || text.includes("ml") || text.includes("internship") || text.includes("practitioner") || text.includes("rag") || text.includes("agent") || text.includes("gemini") || text.includes("claude")) {
      response = `<strong>AI Internship & AI Practitioner Batches 🤖</strong><br><br>
      Eklavya offers specialized, batch-based programs mentored directly by Microsoft Certified Trainer (MCT) Amit Kumar Gupta. These are designed separately for students (AI Internship) and working professionals (AI Practitioner) with foundational and advanced modules:<br><br>
      <ul>
        <li><strong>Layman-Friendly Learning:</strong> Clear, simple explanations of Artificial Intelligence, Machine Learning, and Deep Learning with no technical background or coding required.</li>
        <li><strong>Data Science Integration:</strong> Understanding data pipelines, visualization, and strategic analytics.</li>
        <li><strong>Real-World Case Studies:</strong> Interactive business scenarios mapping AI to daily processes like Netflix recommendations, YouTube algorithms, D-Mart shelf management, crop insurance, and Digit car insurance automation.</li>
        <li><strong>Retrieval-Augmented Generation (RAG):</strong> Master RAG workflows using advanced tools like <strong>NotebookLM</strong>, building custom <strong>Claude Skills</strong>, organizing projects in <strong>Claude Artifacts</strong>, and deploying custom GPTs or Gemini Gems.</li>
        <li><strong>Agentic AI & Custom Workflows:</strong> Deep dive into LLM architectures, tokens, and prompt engineering to build autonomous agents and workflows.</li>
        <li><strong>Personal Portfolios:</strong> Build and host your own interactive curated portfolio or personal website to showcase your skills.</li>
      </ul>
      <p>💡 <em>Batches are scheduled and sized based on learner interest. Contact us on WhatsApp to inquire about the next batch starting dates and timing!</em></p>
      <a href="https://wa.me/917899577788?text=Hello,%20I'm%20interested%20in%20knowing%20more%20about%20Eklavya's%20AI%20Programs." target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); text-align: center; display: block; margin-top: 0.5rem;">💬 Inquire on WhatsApp</a>`;
    }
    else if (text.includes("skilling") || text.includes("excel") || text.includes("scrum") || text.includes("agile") || text.includes("data") || text.includes("earn") || text.includes("vocational") || text.includes("workshop") || text.includes("lecture") || text.includes("seminar")) {
      response = `<strong>Skilling to Learn, Learn to Earn & Expert Workshops 🛠️</strong><br><br>
      We deliver industry-relevant skills led by corporate veterans and certified instructors to make students and professionals employable.<br><br>
      <strong>1. Skilling to Learn, Learn to Earn:</strong><br>
      <ul>
        <li><strong>Advanced Microsoft Excel:</strong> Formula mastery, pivot tables, data cleaning, and dashboards.</li>
        <li><strong>Data Analytics:</strong> Fundamentals of interpreting and visualizing business data.</li>
        <li><strong>Agile Methodologies:</strong> Project management basics, user stories, and collaboration models.</li>
      </ul>
      <strong>2. Expert Lectures & Specialized Workshops:</strong><br>
      <ul>
        <li><strong>Scrum Certifications:</strong> Training for Scrum Master and Product Owner certifications.</li>
        <li><strong>Financial Literacy:</strong> Workshops covering personal finance, understanding markets, and early investing strategies.</li>
        <li><strong>Digital Transformation:</strong> Corporate and institutional guest lectures on technology trends and digital architectures.</li>
      </ul>
      <a href="https://wa.me/917899577788?text=Hello,%20I'm%20interested%20in%20knowing%20more%20about%20Eklavya's%20Skilling%20Workshops." target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); text-align: center; display: block; margin-top: 0.5rem;">💬 Inquire about Skilling Batches</a>`;
    }
    else if (text.includes("program") || text.includes("course") || text.includes("learn") || text.includes("study") || text.includes("offer")) {
      response = `<strong>Eklavya Career Initiative Offerings 🌟</strong><br><br>
      We offer six core volunteer-driven programs designed to support and empower you at every step of your career:<br><br>
      <ol>
        <li><strong>Support a Child Build a Dream:</strong> Tuition fee and exam sponsorship for deserving students.</li>
        <li><strong>Samvaad Se Safalta:</strong> 52-week 1-on-1 virtual spoken English mentoring.</li>
        <li><strong>Love Your Career:</strong> Subject counseling, resume building, and mock interviews.</li>
        <li><strong>Skilling to Learn:</strong> Job-oriented Advanced Excel, Data Analytics, and Agile frameworks.</li>
        <li><strong>AI Internship & Practitioner Programs:</strong> Curated AI, RAG (NotebookLM, Claude, Gemini Gems), Agentic workflows, and portfolio workshops led by MCT Amit Kumar Gupta.</li>
        <li><strong>Expert Workshops:</strong> Specialized certifications training in Scrum, Financial Literacy, and Digital Transformation.</li>
      </ol>
      Contact us on WhatsApp or fill out our contact form to learn more about starting dates and batch openings!<br><br>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
        <a href="https://wa.me/917899577788" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); flex: 1; text-align: center; margin: 0;">💬 WhatsApp us</a>
        <a href="#contact-form-anchor" onclick="document.getElementById('contact-form-anchor').scrollIntoView({behavior: 'smooth'})" class="chat-link-btn" style="flex: 1; text-align: center; margin: 0;">📝 Contact Form</a>
      </div>`;
    }
    else if (text.includes("founder") || text.includes("amit") || text.includes("who created") || text.includes("owner")) {
      response = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <img src="/founder pic.webp" alt="Amit Kumar Gupta" style="width:100%; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <strong>Amit Kumar Gupta — Founder, Eklavya Career Initiative 👨‍🏫</strong><br>
        Amit Kumar Gupta is an IT Strategy Consultant, Digital Transformation Expert, and Microsoft Certified Trainer (MCT) with over 18 years of professional experience across the US, Europe, and Asia-Pacific.<br><br>
        <strong>Professional Highlights:</strong><br>
        <ul>
          <li><strong>Education:</strong> MBA in Finance from Great Lakes Institute of Management (2011-2012) and B.Tech from NIT Bhopal (2003-2007).</li>
          <li><strong>Corporate Experience:</strong> Has served as a Principal Consultant and Program Manager at world-class consulting and tech firms including PwC, Deloitte, EY, Capgemini, Infosys, and Zycus.</li>
          <li><strong>Certifications:</strong> TOGAF 9 Certified, Prince2 Agile Practitioner, Scrum.org certified, and advanced AI systems coach.</li>
          <li><strong>Philanthropy:</strong> Amit founded Eklavya Career Initiative to pay it forward, mentoring underprivileged youth and teaching modern digital and AI skills.</li>
        </ul>
        <a href="https://www.linkedin.com/in/amit-kumar-gupta-33464010/" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #0077b5 0%, #005885 100%); text-align: center; display: block; margin-top: 0.5rem;">💼 Connect on LinkedIn</a>
      </div>`;
    }
    else if (text.includes("experience") || text.includes("work") || text.includes("job") || text.includes("zycus") || text.includes("infosys")) {
      response = "Amit Kumar Gupta has 18+ years of experience working as a Principal Consultant and Program Manager at companies like Zycus, Infosys, PwC, Ernst & Young, Capgemini, and Deloitte. He specializes in SAP S/4 HANA, ERP implementations, and SaaS solutions.";
    }
    else if (text.includes("education") || text.includes("degree") || text.includes("college") || text.includes("university")) {
      response = "Our founder, Amit Kumar Gupta, holds an MBA in Finance from Great Lakes Institute of Management (2011-2012) and a B.Tech from NIT Bhopal (2003-2007).";
    }
    else if (text.includes("certif") || text.includes("skills")) {
      response = "Amit is highly certified: TOGAF 9 Certified, Prince2 Agile Practitioner, Scrum.org, Be10x AI Tools, SAP Security, and Analytics tools like Power BI/Tableau.";
    }
    else if (text.includes("mission") || text.includes("goal") || text.includes("vision") || text.includes("why")) {
      response = `<strong>Our Mission & Vision 🎯</strong><br><br>
      At Eklavya Career Initiative, we believe that talent exists everywhere, but access to opportunity does not. We are a volunteer-driven forum dedicated to leveling the playing field for students and job seekers from underserved backgrounds.<br><br>
      Inspired by the legendary archer <strong>Eklavya</strong>—who mastered archery through absolute determination, self-learning, and self-belief despite having no formal teacher or resources—we help our cadets discover their own paths to success by offering free career counseling, spoken English, technical skilling, and education sponsorships.<br><br>
      Our core motto is:<br>
      <div style="font-size: 1.1rem; font-weight: bold; color: #8b4513; margin: 0.75rem 0; font-style: italic; text-align: center;">
        "No barriers. Just belief. Be Eklavya."
      </div>
      We operate with modest budgets, relying on volunteers and word-of-mouth rather than paid marketing. Your recommendation or social follow is our greatest support!`;
    }
    else if (text.includes("who is eklavya") || text.includes("legend") || text.includes("archer") || text.includes("inspire") || text.includes("inspiration")) {
      response = "The initiative is inspired by the legendary archer <strong>Eklavya</strong>. Despite having no formal teacher or resources, he overcame barriers through sheer determination and self-learning to become a master. Our motto is: <em>'No barriers. Just belief. Be Eklavya.'</em>";
    }
    else if (text.includes("collab") || text.includes("school") || text.includes("ngo") || text.includes("volunteer") || text.includes("join") || text.includes("help") || text.includes("mou") || text.includes("activity") || text.includes("event") || text.includes("partner")) {
      response = "<strong>Activities, Collaborations & Events:</strong> We actively drive engagements at all levels:<br><ul><li><strong>Student Level:</strong> Individual mentorship sessions, English conversation clubs, and hands-on AI tools coaching.</li><li><strong>College & Institution Level:</strong> College collaborations and formal MOUs to run digital skilling programs.</li><li><strong>Corporate & Company Level:</strong> Partnering for professional Scrum certification, Advanced Excel, and corporate digital literacy.</li></ul>We are proud to collaborate with Connect Shiksha, Cubicle Buddies, SYJ Roots, Sahara Society, and Naxlogic. <br><br><a href='#' onclick='document.querySelector(\".events-section\").scrollIntoView({behavior: \"smooth\"})' class='chat-link-btn'>📷 View Gallery & Highlights</a>";
    }
    else if (text.includes("feedback") || text.includes("review") || text.includes("rate") || text.includes("stars")) {
      response = "We value your feedback! Please write a review on our <a href='https://g.page/r/CQ84hAOd5HNNEAE/review' target='_blank'>Google Review Site</a> or fill out our <a href='https://forms.gle/7Z7URBypdJyxy99R8' target='_blank'>Feedback Form</a>.";
    }
    else if (text.includes("hi") || text.includes("hello") || text.includes("hey") || text.includes("namaste")) {
      response = "Namaste! How can I guide you today? I can tell you about our amazing programs, our mission, or the inspiring story of our founder, Amit Kumar Gupta.";
    }
    else {
      response = "That's an interesting question! I am still learning, but you can find detailed information on our website, or you can ask me about our programs, mission, or our founder Amit Kumar Gupta. For direct support, you can reach out to us on <a href='https://wa.me/message/6HYOCZZUFGYUL1' target='_blank'>WhatsApp</a>.";
    }

    setTimeout(() => {
      addMessage(response, "bot");
      setTimeout(() => {
        showMenuHelper();
      }, 1000);
    }, 600);
  }

  function submitChat() {
    if (!chatInput) return;
    const msg = chatInput.value.trim();
    if (!msg) return;

    // Remove any options currently displayed
    const optionsDivs = document.querySelectorAll(".chat-options");
    optionsDivs.forEach(div => div.remove());

    addMessage(msg, "user");
    chatInput.value = "";
    handleUserMessage(msg);
  }

  chatSendBtn?.addEventListener("click", submitChat);
  
  chatInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitChat();
    }
  });
}
