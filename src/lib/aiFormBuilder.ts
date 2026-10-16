import { FormField, FormFieldType } from "@/types/admin";

export interface GenerateFormParams {
  prompt: string;
  eventTitle?: string;
  category?: string;
  teamSizeMin?: number;
  teamSizeMax?: number;
  feeAmount?: number;
  registrationStartDate?: string;
  registrationEndDate?: string;
  isActive?: boolean;
}


export interface GeneratedFormDefinition {
  formTitle: string;
  formDescription: string;
  fields: FormField[];
  providerUsed: "gemini" | "groq" | "openai" | "heuristic_engine";
}

/**
 * Validates a form definition before publication or Google Forms export.
 */
export function validateFormDefinition(fields: FormField[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!Array.isArray(fields) || fields.length === 0) {
    errors.push("The form must contain at least one question.");
    return { valid: false, errors };
  }

  const seenLabels = new Set<string>();

  fields.forEach((field, index) => {
    const pos = index + 1;
    if (!field.label || !field.label.trim()) {
      errors.push(`Question at position #${pos} is missing a question label.`);
    } else {
      const lower = field.label.trim().toLowerCase();
      if (seenLabels.has(lower)) {
        errors.push(`Duplicate question detected: "${field.label}" at position #${pos}.`);
      }
      seenLabels.add(lower);
    }

    if (!field.type) {
      errors.push(`Question "${field.label || `#${pos}`}" must have a valid input type.`);
    }

    if (
      ((field.type === "radio" || field.type === "select") && (!field.options || field.options.length < 2)) ||
      (field.type === "checkbox" && (!field.options || field.options.length < 1))
    ) {
      errors.push(
        `Question "${field.label}" is a choice type (${field.type}) and must provide valid options.`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Built-in Intelligent Semantic Form Builder Engine
 * Analyzes natural language prompts and synthesizes a high-fidelity form schema
 * without requiring external paid API subscriptions.
 */
function buildFormWithHeuristicEngine(params: GenerateFormParams): GeneratedFormDefinition {
  const prompt = params.prompt.trim().toLowerCase();
  const title = params.eventTitle || "AVISHKAR 2026 Event";
  const fields: FormField[] = [];
  let idCounter = 1;

  const nextId = () => `ai-q-${Date.now()}-${idCounter++}`;

  // 1. Full Name (standard student field)
  fields.push({
    id: nextId(),
    label: "Full Name",
    type: "text",
    required: true,
    placeholder: "e.g., Ananya Sharma",
    helpText: "Enter your official student name as registered in university records.",
  });

  // 2. Student Email
  fields.push({
    id: nextId(),
    label: "Student Email Address",
    type: "text",
    required: true,
    placeholder: "student@gdgoenka.ac.in",
    helpText: "Official campus or institutional email address.",
  });

  // 3. Student ID / Roll Number
  fields.push({
    id: nextId(),
    label: "Student Roll Number / Enrollment ID",
    type: "text",
    required: true,
    placeholder: "e.g., 2023GDGU010203",
    helpText: "Official Student Registration Number.",
  });

  // 4. Contact / Phone Number
  fields.push({
    id: nextId(),
    label: "Contact / WhatsApp Number",
    type: "text",
    required: true,
    placeholder: "+91 98765 43210",
    helpText: "10-digit mobile number for team coordination and announcements.",
  });

  // 5. School / Faculty
  fields.push({
    id: nextId(),
    label: "School / Department",
    type: "select",
    required: true,
    options: [
      "School of Engineering & Sciences (SOES)",
      "School of Management (SOM)",
      "School of Law (SOL)",
      "School of Medical & Allied Sciences (SMAS)",
      "School of Humanities & Social Sciences (SOHSS)",
      "School of Agricultural Sciences (SOAS)",
      "External / Other Institution",
    ],
    helpText: "Select your primary school or academic affiliation.",
  });

  // 6. Course & Branch
  if (
    prompt.includes("course") ||
    prompt.includes("branch") ||
    prompt.includes("degree") ||
    prompt.includes("hackathon") ||
    prompt.includes("coding") ||
    prompt.includes("robotics")
  ) {
    fields.push({
      id: nextId(),
      label: "Course & Specialization / Branch",
      type: "text",
      required: true,
      placeholder: "e.g., B.Tech Computer Science & Engineering (AI/ML)",
      helpText: "Mention degree program and academic discipline.",
    });
  }

  // 7. Academic Year
  if (prompt.includes("year") || prompt.includes("semester") || prompt.includes("class")) {
    fields.push({
      id: nextId(),
      label: "Current Year of Study",
      type: "radio",
      required: true,
      options: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Post-Graduate / Masters"],
    });
  }

  // 8. Team Dynamics (Team Name & Size)
  const isIndividual = params.teamSizeMin === 1 && params.teamSizeMax === 1;
  const isTeam =
    !isIndividual &&
    ((params.teamSizeMax !== undefined && params.teamSizeMax > 1) ||
      (params.teamSizeMin !== undefined && params.teamSizeMin > 1) ||
      prompt.includes("team") ||
      prompt.includes("squad") ||
      prompt.includes("partner"));

  if (isTeam) {
    const minTeam = Math.max(1, params.teamSizeMin || 2);
    const maxTeam = Math.max(minTeam, params.teamSizeMax || 4);

    fields.push({
      id: nextId(),
      label: "Team / Squad Designation",
      type: "text",
      required: true,
      placeholder: "e.g., CyberPulse Pioneers",
      helpText: "Choose a unique and official team identity for competition submissions.",
    });

    const teamOptions: string[] = [];
    for (let s = minTeam; s <= maxTeam; s++) {
      teamOptions.push(s === 1 ? "1 Member (Solo Participation)" : `${s} Members`);
    }

    if (teamOptions.length < 2) {
      teamOptions.push(`Confirmed Squad of ${minTeam}`);
    }

    fields.push({
      id: nextId(),
      label: "Declared Team Size",
      type: "select",
      required: true,
      options: teamOptions,
      helpText: `Total number of confirmed participants in this squad (Configured Capacity: ${minTeam} to ${maxTeam} members).`,
    });
  }


  // 9. Prior Experience / Domain Level
  if (
    prompt.includes("experience") ||
    prompt.includes("skill") ||
    prompt.includes("level") ||
    prompt.includes("prior")
  ) {
    fields.push({
      id: nextId(),
      label: "Prior Domain Experience Level",
      type: "radio",
      required: true,
      options: [
        "Beginner (First-time fest/hackathon participant)",
        "Intermediate (Built personal projects or participated previously)",
        "Advanced (Won or placed in regional/national technical competitions)",
      ],
    });
  }

  // 10. Technical Stack / Toolset
  if (
    prompt.includes("stack") ||
    prompt.includes("tech") ||
    prompt.includes("tools") ||
    prompt.includes("language") ||
    prompt.includes("framework") ||
    prompt.includes("hackathon") ||
    prompt.includes("ai")
  ) {
    fields.push({
      id: nextId(),
      label: "Primary Technical Skills & Stacks",
      type: "checkbox",
      required: false,
      options: [
        "Python / Machine Learning / Data Science",
        "Full-Stack Web (React, Next.js, Node.js)",
        "Mobile App Development (Flutter, React Native)",
        "Cloud Infrastructure & DevOps (Docker, AWS)",
        "Embedded Systems / Robotics / IoT (Arduino, ROS)",
        "Cybersecurity & Network Auditing",
        "UI/UX Design & Prototyping (Figma)",
      ],
      helpText: "Select all domains and technologies your team excels in.",
    });
  }

  // 11. GitHub / Portfolio URL
  if (
    prompt.includes("github") ||
    prompt.includes("portfolio") ||
    prompt.includes("linkedin") ||
    prompt.includes("profile") ||
    prompt.includes("resume")
  ) {
    fields.push({
      id: nextId(),
      label: "GitHub / Portfolio / Project Demonstration Link",
      type: "text",
      required: false,
      placeholder: "https://github.com/your-username",
      helpText: "Provide public repository or live project link.",
    });
  }

  // 12. Hardware / Special Requirements (if robotics/hardware mentioned)
  if (
    prompt.includes("hardware") ||
    prompt.includes("robot") ||
    prompt.includes("kit") ||
    prompt.includes("component")
  ) {
    fields.push({
      id: nextId(),
      label: "Hardware Requirements & Bot Specifications",
      type: "textarea",
      required: false,
      placeholder: "Mention chassis dimensions, motor ratings, battery voltage, and required safety switches...",
      helpText: "Detail equipment you will bring or will require on-site.",
    });
  }

  // 13. Dietary or T-Shirt (if hospitality mentioned)
  if (prompt.includes("diet") || prompt.includes("food") || prompt.includes("t-shirt") || prompt.includes("tshirt")) {
    fields.push({
      id: nextId(),
      label: "Dietary Preferences & Meal Requirements",
      type: "radio",
      required: true,
      options: ["Vegetarian", "Non-Vegetarian", "Vegan / Jain Option"],
    });
  }

  // 14. Consent & Privacy Disclaimer (Mandatory)
  fields.push({
    id: nextId(),
    label: "Declaration, Code of Conduct & Privacy Consent",
    type: "checkbox",
    required: true,
    options: [
      "I hereby declare that all submitted academic and contact information is authentic. I agree to abide by the AVISHKAR Code of Conduct and University event policies.",
    ],
    helpText: "Mandatory compliance agreement for all registered participants.",
  });

  return {
    formTitle: `${title} — Participant Registration Questionnaire`,
    formDescription: `Official registration questionnaire for ${title}. Please provide verified student and squad information to confirm your participation.`,
    fields,
    providerUsed: "heuristic_engine",
  };
}

/**
 * Calls Gemini API if GEMINI_API_KEY / GOOGLE_AI_API_KEY is configured in environment.
 */
async function callGeminiApi(
  apiKey: string,
  params: GenerateFormParams
): Promise<GeneratedFormDefinition | null> {
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = `
You are an expert event operations architect for AVISHKAR, a premier university technology and science fest.
Your task is to generate a structured registration form definition based on the user's event prompt.
Supported question types:
- text: Single line input (name, ID, roll no, short answer)
- textarea: Multi-line long text (project abstract, hardware specs)
- select: Dropdown selection (School, branch, team size)
- radio: Single choice from multiple options (year of study, experience level)
- checkbox: Multi-select choices (technical skills, consent acknowledgment)
- date: Date selection
- number: Numerical input

Return ONLY valid JSON matching this exact structure:
{
  "formTitle": "Event Title — Registration Questionnaire",
  "formDescription": "Detailed overview of what is expected from participants",
  "fields": [
    {
      "id": "q-1",
      "label": "Question Label",
      "type": "text" | "textarea" | "select" | "radio" | "checkbox" | "date" | "number",
      "required": true | false,
      "placeholder": "Helpful placeholder",
      "options": ["Option A", "Option B"],
      "helpText": "Helpful guidance"
    }
  ]
}
`.trim();

  const userContent = `Event Title: ${params.eventTitle || "AVISHKAR 2026 Event"}
Event Category: ${params.category || "General"}
Min Team Size: ${params.teamSizeMin || 1}
Max Team Size: ${params.teamSizeMax || 4}
Administrator Requirements Prompt: "${params.prompt}"`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemInstruction },
              { text: userContent },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      console.warn(`Gemini API call failed with HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    if (!parsed.fields || !Array.isArray(parsed.fields)) return null;

    return {
      formTitle: parsed.formTitle || `${params.eventTitle || "Event"} — Registration`,
      formDescription: parsed.formDescription || "Official registration questionnaire.",
      fields: parsed.fields.map((f: any, idx: number) => ({
        id: f.id || `ai-q-${idx + 1}`,
        label: String(f.label || `Question ${idx + 1}`),
        type: (f.type as FormFieldType) || "text",
        required: Boolean(f.required),
        placeholder: f.placeholder ? String(f.placeholder) : undefined,
        options: Array.isArray(f.options) ? f.options.map(String) : undefined,
        helpText: f.helpText ? String(f.helpText) : undefined,
      })),
      providerUsed: "gemini",
    };
  } catch (err) {
    console.warn("Gemini generation error, falling back to heuristic engine:", err);
    return null;
  }
}

/**
 * Calls OpenAI API if OPENAI_API_KEY is configured in environment.
 */
async function callOpenAiApi(
  apiKey: string,
  params: GenerateFormParams
): Promise<GeneratedFormDefinition | null> {
  const url = "https://api.openai.com/v1/chat/completions";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an event form architect. Output JSON: { "formTitle": string, "formDescription": string, "fields": [{ "id": string, "label": string, "type": "text"|"textarea"|"select"|"radio"|"checkbox"|"date"|"number", "required": boolean, "placeholder"?: string, "options"?: string[], "helpText"?: string }] }`,
          },
          {
            role: "user",
            content: `Create registration form for "${params.eventTitle || "Event"}". Requirements: ${params.prompt}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.fields)) return null;

    return {
      formTitle: parsed.formTitle || `${params.eventTitle || "Event"} — Registration`,
      formDescription: parsed.formDescription || "Official registration questionnaire.",
      fields: parsed.fields,
      providerUsed: "openai",
    };
  } catch {
    return null;
  }
}

/**
 * Calls Groq Cloud API if GROQ_API_KEY is configured in environment.
 */
async function callGroqApi(
  apiKey: string,
  params: GenerateFormParams
): Promise<GeneratedFormDefinition | null> {
  const model = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const isIndividual = params.teamSizeMin === 1 && params.teamSizeMax === 1;
  const minTeam = Math.max(1, params.teamSizeMin || (isIndividual ? 1 : 2));
  const maxTeam = Math.max(minTeam, params.teamSizeMax || (isIndividual ? 1 : 4));

  const teamRule = isIndividual
    ? "Participation is strictly INDIVIDUAL (1 member). Do NOT include questions for team name, team size, or team members."
    : `Participation is TEAM-BASED. Minimum team size is ${minTeam} and maximum team size is ${maxTeam}. You MUST include a question for 'Team / Squad Designation' (type: text) and a question for 'Declared Team Size' (type: select) with choice options strictly ranging from '${minTeam} Members' to '${maxTeam} Members'.`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are an event registration questionnaire architect. Output strictly valid JSON matching this schema:
{
  "formTitle": "Official Registration Title",
  "formDescription": "Brief description",
  "fields": [
    {
      "id": "q-1",
      "label": "Question Label",
      "type": "text" | "textarea" | "select" | "radio" | "checkbox" | "date" | "number",
      "required": true,
      "placeholder": "Helpful placeholder",
      "options": ["Option 1", "Option 2"],
      "helpText": "Guidance"
    }
  ]
}`,
          },
          {
            role: "user",
            content: `Event Name: "${params.eventTitle || "AVISHKAR Event"}".
Category: ${params.category || "General"}.
Team Capacity Requirement: ${teamRule}
Registration Fee: INR ${params.feeAmount ?? 500}.
Registration Schedule: ${params.registrationStartDate || "Immediate"} to ${params.registrationEndDate || "Until event"}.
Additional Instructions: ${params.prompt || "Generate appropriate registration questionnaire for this competition"}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    // Extract JSON block if surrounded by markdown code fences
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawContent];
    const parsed = JSON.parse(jsonMatch[1] || rawContent);
    if (!parsed || !Array.isArray(parsed.fields)) return null;

    let mappedFields: FormField[] = parsed.fields.map((f: any, idx: number) => ({
      id: f.id || `ai-groq-${idx + 1}`,
      label: String(f.label || `Question ${idx + 1}`),
      type: (f.type as FormFieldType) || "text",
      required: Boolean(f.required),
      placeholder: f.placeholder ? String(f.placeholder) : undefined,
      options: Array.isArray(f.options) ? f.options.map(String) : undefined,
      helpText: f.helpText ? String(f.helpText) : undefined,
    }));

    // If individual event, prune any team questions
    if (isIndividual) {
      mappedFields = mappedFields.filter(
        (f) =>
          !f.label.toLowerCase().includes("team") &&
          !f.label.toLowerCase().includes("squad") &&
          !f.label.toLowerCase().includes("partner")
      );
    } else {
      // Filter out legacy free-form member details textarea in favor of dynamic per-member cards
      mappedFields = mappedFields.filter(
        (f) => !f.label.toLowerCase().includes("additional team member")
      );

      // Ensure team questions are present and team size matches configured capacity
      const teamOptions: string[] = [];
      for (let s = minTeam; s <= maxTeam; s++) {
        teamOptions.push(s === 1 ? "1 Member (Solo Participation)" : `${s} Members`);
      }
      if (teamOptions.length < 2) {
        teamOptions.push(`Confirmed Squad of ${minTeam}`);
      }

      let hasTeamName = false;
      let hasTeamSize = false;

      for (const f of mappedFields) {
        const lower = f.label.toLowerCase();
        if (lower.includes("team") && (lower.includes("name") || lower.includes("designation") || lower.includes("squad"))) {
          hasTeamName = true;
        }
        if (lower.includes("size")) {
          hasTeamSize = true;
          f.type = "select";
          f.options = teamOptions;
          f.helpText = `Declared squad size (Configured capacity: ${minTeam} to ${maxTeam} members).`;
        }
      }

      if (!hasTeamName) {
        mappedFields.splice(Math.min(3, mappedFields.length), 0, {
          id: `ai-groq-team-name-${Date.now()}`,
          label: "Team / Squad Designation",
          type: "text",
          required: true,
          placeholder: "e.g., CyberPulse Pioneers",
          helpText: "Choose a unique and official team identity.",
        });
      }

      if (!hasTeamSize) {
        mappedFields.splice(Math.min(4, mappedFields.length), 0, {
          id: `ai-groq-team-size-${Date.now()}`,
          label: "Declared Team Size",
          type: "select",
          required: true,
          options: teamOptions,
          helpText: `Total confirmed members in this squad (Configured capacity: ${minTeam} to ${maxTeam} members).`,
        });
      }
    }

    const hasConsent = mappedFields.some(
      (f) => f.label.toLowerCase().includes("declaration") || f.label.toLowerCase().includes("consent")
    );
    if (!hasConsent) {
      mappedFields.push({
        id: `ai-groq-${mappedFields.length + 1}`,
        label: "Declaration, Code of Conduct & Privacy Consent",
        type: "checkbox",
        required: true,
        options: [
          "I hereby declare that all submitted academic and contact information is authentic. I agree to abide by the AVISHKAR Code of Conduct and University event policies.",
        ],
        helpText: "Mandatory compliance agreement for all registered participants.",
      });
    }

    return {
      formTitle: parsed.formTitle || `${params.eventTitle || "Event"} — Registration`,
      formDescription: parsed.formDescription || "Official registration questionnaire.",
      fields: mappedFields,
      providerUsed: "groq",
    };
  } catch {
    return null;
  }
}



/**
 * Main AI Form Builder entrypoint
 * Intelligently routes between Gemini, Groq, OpenAI, or the built-in Semantic Engine.
 */
export async function generateFormDefinition(
  params: GenerateFormParams
): Promise<GeneratedFormDefinition> {
  // 1. Primary: Server-side Groq Cloud AI Integration (High-Speed LLM)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.trim()) {
    const groqResult = await callGroqApi(groqKey.trim(), params);
    if (groqResult && groqResult.fields.length > 0) {
      return groqResult;
    }
  }

  // 2. Secondary fallback providers if configured
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (geminiKey && geminiKey.trim()) {
    const geminiResult = await callGeminiApi(geminiKey.trim(), params);
    if (geminiResult && geminiResult.fields.length > 0) {
      return geminiResult;
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.trim()) {
    const openAiResult = await callOpenAiApi(openaiKey.trim(), params);
    if (openAiResult && openAiResult.fields.length > 0) {
      return openAiResult;
    }
  }

  // 3. Robust Built-In Offline Semantic Engine (Always Available, Zero Cost)
  return buildFormWithHeuristicEngine(params);
}

