// IELTS Authentic Question Bank - Cambridge-style questions

export interface IELTSListeningQuestion {
  id: string;
  section: 1 | 2 | 3 | 4;
  type: "multiple-choice" | "form-completion" | "sentence-completion" | "matching" | "map-labeling" | "diagram-labeling";
  question: string;
  options?: string[];
  correctAnswer: string;
  audioText: string; // Text that would be spoken as audio
  accent?: "british" | "american" | "australian";
}

export interface IELTSReadingPassage {
  id: string;
  title: string;
  content: string;
  questions: IELTSReadingQuestion[];
}

export interface IELTSReadingQuestion {
  id: string;
  type: "true-false-not-given" | "yes-no-not-given" | "matching-headings" | "matching-information" | "sentence-completion" | "multiple-choice" | "summary-completion" | "short-answer";
  question: string;
  options?: string[];
  correctAnswer: string;
}

export interface IELTSWritingTask {
  id: string;
  task: 1 | 2;
  type?: "bar-chart" | "line-graph" | "pie-chart" | "table" | "process" | "map" | "essay";
  prompt: string;
  chartDescription?: string;
  sampleAnswer?: string;
  minWords: number;
}

export interface IELTSSpeakingPrompt {
  id: string;
  part: 1 | 2 | 3;
  prompt: string;
  cueCardPoints?: string[];
  followUpQuestions?: string[];
}

// SECTION 1: Daily conversation (British accent)
const listeningSection1: IELTSListeningQuestion[] = [
  {
    id: "l1-1", section: 1, type: "form-completion", accent: "british",
    question: "Customer's surname:",
    correctAnswer: "Henderson",
    audioText: "Good morning, I'd like to make a reservation please. My name is Sarah Henderson, that's H-E-N-D-E-R-S-O-N."
  },
  {
    id: "l1-2", section: 1, type: "form-completion", accent: "british",
    question: "Contact phone number:",
    correctAnswer: "07845 923100",
    audioText: "And what's your contact number? It's 07845 923100."
  },
  {
    id: "l1-3", section: 1, type: "multiple-choice", accent: "british",
    question: "The customer wants to book accommodation for:",
    options: ["A) 3 nights", "B) 5 nights", "C) 7 nights", "D) 10 nights"],
    correctAnswer: "B",
    audioText: "How long will you be staying? We'd like to book for five nights, from the 12th to the 17th of March."
  },
  {
    id: "l1-4", section: 1, type: "form-completion", accent: "british",
    question: "Type of room preferred:",
    correctAnswer: "double",
    audioText: "What type of room would you like? A double room with a sea view if possible."
  },
  {
    id: "l1-5", section: 1, type: "form-completion", accent: "british",
    question: "Special dietary requirement:",
    correctAnswer: "vegetarian",
    audioText: "Do you have any special dietary requirements? Yes, I'm vegetarian, so please note that for the restaurant."
  },
  {
    id: "l1-6", section: 1, type: "multiple-choice", accent: "british",
    question: "The total cost of the booking is:",
    options: ["A) £275", "B) £350", "C) £425", "D) £500"],
    correctAnswer: "C",
    audioText: "The total for five nights including breakfast comes to four hundred and twenty-five pounds."
  },
  {
    id: "l1-7", section: 1, type: "form-completion", accent: "british",
    question: "Payment method:",
    correctAnswer: "credit card",
    audioText: "How would you like to pay? I'll pay by credit card, if that's acceptable."
  },
  {
    id: "l1-8", section: 1, type: "multiple-choice", accent: "british",
    question: "Check-in time is:",
    options: ["A) 12:00", "B) 14:00", "C) 15:00", "D) 16:00"],
    correctAnswer: "B",
    audioText: "Check-in is from two PM onwards. We should arrive around three in the afternoon."
  },
  {
    id: "l1-9", section: 1, type: "form-completion", accent: "british",
    question: "Guest's email address:",
    correctAnswer: "s.henderson@email.com",
    audioText: "Could I have your email for confirmation? It's s dot henderson at email dot com."
  },
  {
    id: "l1-10", section: 1, type: "sentence-completion", accent: "british",
    question: "Parking at the hotel is _____",
    correctAnswer: "free",
    audioText: "Is there parking available? Yes, we have complimentary parking, so it's completely free for all guests."
  },
];

// SECTION 2: Monologue on general topic (American accent)
const listeningSection2: IELTSListeningQuestion[] = [
  {
    id: "l2-1", section: 2, type: "multiple-choice", accent: "american",
    question: "The speaker works for:",
    options: ["A) a museum", "B) a library", "C) a community center", "D) a university"],
    correctAnswer: "C",
    audioText: "Welcome everyone to the Central Community Center. I'm here to tell you about our upcoming programs."
  },
  {
    id: "l2-2", section: 2, type: "sentence-completion", accent: "american",
    question: "The yoga classes are held on _____ mornings.",
    correctAnswer: "Tuesday",
    audioText: "Our popular yoga sessions are held every Tuesday morning from nine to ten thirty."
  },
  {
    id: "l2-3", section: 2, type: "form-completion", accent: "american",
    question: "The photography workshop costs $_____ per month.",
    correctAnswer: "45",
    audioText: "The photography workshop is forty-five dollars per month, which includes all materials."
  },
  {
    id: "l2-4", section: 2, type: "matching", accent: "american",
    question: "Match the activity to its location: Children's reading club",
    options: ["A) Main Hall", "B) Room 12", "C) Garden Area", "D) Studio 3"],
    correctAnswer: "B",
    audioText: "The children's reading club meets in Room 12 every Saturday afternoon."
  },
  {
    id: "l2-5", section: 2, type: "multiple-choice", accent: "american",
    question: "The swimming pool is closed on:",
    options: ["A) Mondays", "B) Wednesdays", "C) Fridays", "D) Sundays"],
    correctAnswer: "A",
    audioText: "Please note that the pool is closed every Monday for maintenance."
  },
  {
    id: "l2-6", section: 2, type: "sentence-completion", accent: "american",
    question: "Senior citizens receive a _____% discount on all activities.",
    correctAnswer: "20",
    audioText: "All members aged sixty-five and over get a twenty percent discount on activities."
  },
  {
    id: "l2-7", section: 2, type: "form-completion", accent: "american",
    question: "The center opens at _____ AM on weekdays.",
    correctAnswer: "7",
    audioText: "On weekdays, we open at seven AM and close at nine PM."
  },
  {
    id: "l2-8", section: 2, type: "multiple-choice", accent: "american",
    question: "The arts and crafts session is suitable for ages:",
    options: ["A) 5-8", "B) 8-12", "C) 12-16", "D) All ages"],
    correctAnswer: "D",
    audioText: "Our arts and crafts sessions welcome participants of all ages."
  },
  {
    id: "l2-9", section: 2, type: "sentence-completion", accent: "american",
    question: "New members need to bring _____ forms of ID.",
    correctAnswer: "two",
    audioText: "When registering, new members must present two forms of identification."
  },
  {
    id: "l2-10", section: 2, type: "form-completion", accent: "american",
    question: "The annual membership fee is $_____ per family.",
    correctAnswer: "120",
    audioText: "Family membership costs one hundred and twenty dollars annually."
  },
];

// SECTION 3: Academic discussion (Australian accent)
const listeningSection3: IELTSListeningQuestion[] = [
  {
    id: "l3-1", section: 3, type: "multiple-choice", accent: "australian",
    question: "The students are discussing their project on:",
    options: ["A) marine biology", "B) climate change", "C) renewable energy", "D) urban planning"],
    correctAnswer: "C",
    audioText: "So Emma, have you started the research for our renewable energy project? Yes, I've been looking at solar panel efficiency."
  },
  {
    id: "l3-2", section: 3, type: "matching", accent: "australian",
    question: "Match the student to their assigned topic: Emma",
    options: ["A) Wind power", "B) Solar panels", "C) Hydroelectric", "D) Nuclear"],
    correctAnswer: "B",
    audioText: "I thought I'd focus on solar panels since that's my strongest area."
  },
  {
    id: "l3-3", section: 3, type: "sentence-completion", accent: "australian",
    question: "The deadline for the first draft is the _____ of November.",
    correctAnswer: "15th",
    audioText: "Remember, we need to submit our first draft by the fifteenth of November."
  },
  {
    id: "l3-4", section: 3, type: "multiple-choice", accent: "australian",
    question: "The professor suggested they include:",
    options: ["A) more statistics", "B) fewer diagrams", "C) case studies", "D) personal opinions"],
    correctAnswer: "C",
    audioText: "Professor Williams recommended that we include some relevant case studies from other countries."
  },
  {
    id: "l3-5", section: 3, type: "form-completion", accent: "australian",
    question: "The presentation must be _____ minutes long.",
    correctAnswer: "15",
    audioText: "Each group will have fifteen minutes for their presentation followed by questions."
  },
  {
    id: "l3-6", section: 3, type: "matching", accent: "australian",
    question: "Match the student to their assigned topic: Tom",
    options: ["A) Wind power", "B) Solar panels", "C) Hydroelectric", "D) Cost analysis"],
    correctAnswer: "A",
    audioText: "Tom, you mentioned you wanted to research wind power installations."
  },
  {
    id: "l3-7", section: 3, type: "multiple-choice", accent: "australian",
    question: "The students will meet next in the:",
    options: ["A) library", "B) cafeteria", "C) computer lab", "D) lecture hall"],
    correctAnswer: "A",
    audioText: "Let's meet in the library next Tuesday to compare our notes."
  },
  {
    id: "l3-8", section: 3, type: "sentence-completion", accent: "australian",
    question: "The word limit for the written report is _____ words.",
    correctAnswer: "3000",
    audioText: "Don't forget the written component should be around three thousand words maximum."
  },
  {
    id: "l3-9", section: 3, type: "multiple-choice", accent: "australian",
    question: "Emma suggests they use _____ for their diagrams.",
    options: ["A) PowerPoint", "B) Canva", "C) Excel", "D) hand-drawn"],
    correctAnswer: "B",
    audioText: "I think Canva would be great for creating professional-looking diagrams."
  },
  {
    id: "l3-10", section: 3, type: "form-completion", accent: "australian",
    question: "The project is worth _____% of the final grade.",
    correctAnswer: "40",
    audioText: "This counts for forty percent of our final grade, so we need to do well."
  },
];

// SECTION 4: Academic lecture (British accent)
const listeningSection4: IELTSListeningQuestion[] = [
  {
    id: "l4-1", section: 4, type: "sentence-completion", accent: "british",
    question: "The lecture is about the history of _____.",
    correctAnswer: "coffee",
    audioText: "Good afternoon. Today's lecture will explore the fascinating history of coffee and its global journey."
  },
  {
    id: "l4-2", section: 4, type: "form-completion", accent: "british",
    question: "Coffee was first discovered in _____ in the 9th century.",
    correctAnswer: "Ethiopia",
    audioText: "The coffee plant was first discovered in Ethiopia, probably around the ninth century."
  },
  {
    id: "l4-3", section: 4, type: "multiple-choice", accent: "british",
    question: "Coffee houses in England were called:",
    options: ["A) penny universities", "B) coffee clubs", "C) drink halls", "D) bean shops"],
    correctAnswer: "A",
    audioText: "In seventeenth century England, coffee houses were nicknamed 'penny universities' because of the intellectual discussions held there."
  },
  {
    id: "l4-4", section: 4, type: "sentence-completion", accent: "british",
    question: "Brazil now produces approximately _____% of the world's coffee.",
    correctAnswer: "30",
    audioText: "Today, Brazil remains the largest producer, accounting for roughly thirty percent of global production."
  },
  {
    id: "l4-5", section: 4, type: "multiple-choice", accent: "british",
    question: "The main compound in coffee that affects sleep is:",
    options: ["A) tannin", "B) caffeine", "C) antioxidants", "D) sugar"],
    correctAnswer: "B",
    audioText: "Caffeine, the primary psychoactive compound in coffee, blocks adenosine receptors and affects sleep patterns."
  },
  {
    id: "l4-6", section: 4, type: "form-completion", accent: "british",
    question: "The optimal water temperature for brewing is _____ degrees Celsius.",
    correctAnswer: "93",
    audioText: "For the best extraction, water should be heated to approximately ninety-three degrees Celsius."
  },
  {
    id: "l4-7", section: 4, type: "sentence-completion", accent: "british",
    question: "The two main species of coffee are Arabica and _____.",
    correctAnswer: "Robusta",
    audioText: "There are two main species commercially grown: Arabica, known for its smooth taste, and Robusta, which is more bitter."
  },
  {
    id: "l4-8", section: 4, type: "multiple-choice", accent: "british",
    question: "According to the lecturer, moderate coffee consumption is:",
    options: ["A) harmful", "B) neutral", "C) beneficial", "D) not studied"],
    correctAnswer: "C",
    audioText: "Recent studies suggest that moderate coffee consumption may actually have several beneficial health effects."
  },
  {
    id: "l4-9", section: 4, type: "form-completion", accent: "british",
    question: "Global coffee consumption has increased by _____% in the last decade.",
    correctAnswer: "25",
    audioText: "Remarkably, global consumption has risen by twenty-five percent over the past ten years."
  },
  {
    id: "l4-10", section: 4, type: "sentence-completion", accent: "british",
    question: "The speaker mentions that sustainable farming is becoming more _____.",
    correctAnswer: "important",
    audioText: "As climate change affects growing regions, sustainable farming practices are becoming increasingly important."
  },
];

// Combine all sections
export const allListeningQuestions: IELTSListeningQuestion[] = [
  ...listeningSection1,
  ...listeningSection2,
  ...listeningSection3,
  ...listeningSection4,
];

// Reading Passages (3 passages with ~13-14 questions each)
export const readingPassage1: IELTSReadingPassage = {
  id: "r1",
  title: "The Rise of Urban Farming",
  content: `Urban farming, also known as urban agriculture, refers to the practice of cultivating, processing, and distributing food in or around urban areas. The concept has gained tremendous popularity in recent years as cities worldwide grapple with food security, environmental concerns, and the desire for fresh, locally sourced produce.

The history of urban farming dates back centuries. During World War II, "Victory Gardens" in the United States and Britain helped citizens supplement their rations. Today, the movement has evolved far beyond wartime necessity into a sophisticated approach to sustainable living.

Modern urban farms take many forms. Rooftop gardens utilise otherwise wasted space atop buildings. Vertical farms use controlled environments and stacked growing systems to maximise production in minimal space. Community gardens bring neighbours together while providing fresh vegetables. Some innovative projects have even converted abandoned warehouses into productive growing spaces.

The benefits of urban farming extend well beyond food production. Environmental advantages include reduced transportation emissions, decreased urban heat island effect, improved air quality, and enhanced biodiversity. Social benefits encompass community building, education opportunities, and increased access to healthy food in areas often described as "food deserts."

However, challenges remain significant. Urban farmers must contend with limited space, soil contamination from industrial activities, water access and quality issues, and complex regulatory frameworks. The economics of urban farming can also be challenging, with high startup costs and uncertain profitability.

Despite these obstacles, technology is driving innovation in the sector. Hydroponic and aeroponic systems eliminate the need for soil. LED lighting allows year-round production regardless of climate. Automated systems reduce labour costs and improve efficiency. Data analytics help optimise growing conditions and predict yields.

Cities around the world are embracing urban agriculture. Singapore has set ambitious targets for local food production. Paris has created incentives for rooftop farms. Detroit has transformed vacant lots into productive urban farms. Tokyo has integrated farming into retail spaces. These examples demonstrate the global appeal and adaptability of urban farming concepts.

Looking ahead, urban farming is likely to play an increasingly important role in feeding growing urban populations sustainably. While it may never replace traditional agriculture entirely, it offers a valuable complement that brings production closer to consumption and engages urban dwellers with their food sources.`,
  questions: [
    { id: "r1-1", type: "true-false-not-given", question: "Victory Gardens were only used in the United States.", correctAnswer: "FALSE" },
    { id: "r1-2", type: "true-false-not-given", question: "Rooftop gardens are the most common form of urban farming.", correctAnswer: "NOT GIVEN" },
    { id: "r1-3", type: "true-false-not-given", question: "Urban farming can help reduce air pollution in cities.", correctAnswer: "TRUE" },
    { id: "r1-4", type: "sentence-completion", question: "Areas with limited access to healthy food are sometimes called _____.", correctAnswer: "food deserts" },
    { id: "r1-5", type: "multiple-choice", question: "Which is NOT mentioned as a challenge for urban farming?", options: ["A) Limited space", "B) Soil contamination", "C) Lack of interest", "D) Complex regulations"], correctAnswer: "C" },
    { id: "r1-6", type: "sentence-completion", question: "_____ systems allow food to be grown without soil.", correctAnswer: "Hydroponic and aeroponic" },
    { id: "r1-7", type: "matching-information", question: "Which city has transformed vacant lots into farms?", options: ["A) Singapore", "B) Paris", "C) Detroit", "D) Tokyo"], correctAnswer: "C" },
    { id: "r1-8", type: "matching-information", question: "Which city has set targets for local food production?", options: ["A) Singapore", "B) Paris", "C) Detroit", "D) Tokyo"], correctAnswer: "A" },
    { id: "r1-9", type: "true-false-not-given", question: "Urban farming will eventually replace traditional agriculture.", correctAnswer: "FALSE" },
    { id: "r1-10", type: "sentence-completion", question: "_____ helps optimise growing conditions and predict yields.", correctAnswer: "Data analytics" },
    { id: "r1-11", type: "multiple-choice", question: "According to the passage, Victory Gardens helped people during:", options: ["A) the Great Depression", "B) World War I", "C) World War II", "D) the Industrial Revolution"], correctAnswer: "C" },
    { id: "r1-12", type: "true-false-not-given", question: "LED lighting enables food production throughout the year.", correctAnswer: "TRUE" },
    { id: "r1-13", type: "sentence-completion", question: "The passage suggests urban farming brings food _____ closer to consumption.", correctAnswer: "production" },
  ]
};

export const readingPassage2: IELTSReadingPassage = {
  id: "r2",
  title: "The Psychology of Colour",
  content: `Colour psychology is the study of how colours affect human behaviour, mood, and decision-making. While some colour associations are culturally learned, research suggests that certain colour responses may be universal, rooted in our evolutionary past.

Red, for instance, is commonly associated with danger, excitement, and passion. Studies have shown that exposure to red can increase heart rate and stimulate appetite, which explains its prevalence in restaurant branding and warning signs. Athletes competing against opponents wearing red have been found to perform slightly worse, suggesting the colour may have an intimidating effect.

Blue, conversely, tends to have a calming influence. Research indicates that blue light can lower blood pressure and reduce anxiety. This has led to the installation of blue lighting in some public spaces to deter crime and self-harm. Many technology companies choose blue logos to convey trustworthiness and reliability.

The impact of colour in marketing and branding cannot be overstated. Consumers make subconscious judgments about products within 90 seconds of viewing them, and up to 90% of that assessment may be based on colour alone. Brands carefully select colour palettes to convey specific messages and appeal to target demographics.

Yellow is often associated with optimism and warmth, making it popular for brands seeking to appear friendly and accessible. However, it can also cause eye strain in large amounts and may increase feelings of anxiety. Green typically evokes nature, health, and tranquility, explaining its frequent use by organic food companies and wellness brands.

Cultural differences in colour perception are significant and must be considered in global marketing. While white represents purity and weddings in Western cultures, it is associated with death and mourning in many Eastern societies. Purple has historically been linked to royalty in Europe due to the expense of purple dyes, but this association may not translate across all cultures.

The built environment also uses colour strategically. Hospitals often use calming colours like green and blue to reduce patient anxiety. Schools may use yellow in learning areas to stimulate mental activity while using blue in corridors to create a calming transition between classes. Retail environments carefully design colour schemes to influence shopping behaviour.

Recent research has explored colour's impact on productivity and creativity. One study found that red environments enhanced performance on detail-oriented tasks, while blue settings improved creative thinking. This has implications for office design, suggesting that different work areas might benefit from different colour schemes.

The relationship between colour and emotion is complex and continues to be studied. While general patterns exist, individual responses to colour are influenced by personal experience, cultural background, and even current mood. What remains clear is that colour is a powerful, if subtle, influence on human psychology and behaviour.`,
  questions: [
    { id: "r2-1", type: "yes-no-not-given", question: "All colour associations are learned from culture.", correctAnswer: "NO" },
    { id: "r2-2", type: "sentence-completion", question: "Red is commonly used in restaurants because it can stimulate _____.", correctAnswer: "appetite" },
    { id: "r2-3", type: "yes-no-not-given", question: "Blue lighting has been installed in some public spaces to prevent crime.", correctAnswer: "YES" },
    { id: "r2-4", type: "multiple-choice", question: "According to the passage, consumers judge products primarily based on:", options: ["A) price", "B) colour", "C) brand name", "D) packaging size"], correctAnswer: "B" },
    { id: "r2-5", type: "sentence-completion", question: "Yellow can cause _____ when used excessively.", correctAnswer: "eye strain" },
    { id: "r2-6", type: "yes-no-not-given", question: "Purple dyes were historically expensive in Europe.", correctAnswer: "YES" },
    { id: "r2-7", type: "matching-headings", question: "Which colour represents death in some Eastern cultures?", options: ["A) Black", "B) White", "C) Red", "D) Purple"], correctAnswer: "B" },
    { id: "r2-8", type: "sentence-completion", question: "Schools may use _____ in corridors to create calming transitions.", correctAnswer: "blue" },
    { id: "r2-9", type: "multiple-choice", question: "Red environments were found to enhance:", options: ["A) creative thinking", "B) physical strength", "C) detail-oriented tasks", "D) relaxation"], correctAnswer: "C" },
    { id: "r2-10", type: "yes-no-not-given", question: "Blue settings improved performance on analytical tasks.", correctAnswer: "NOT GIVEN" },
    { id: "r2-11", type: "sentence-completion", question: "Organic food companies often use _____ colour in their branding.", correctAnswer: "green" },
    { id: "r2-12", type: "yes-no-not-given", question: "Individual colour responses are always predictable.", correctAnswer: "NO" },
    { id: "r2-13", type: "multiple-choice", question: "Many technology companies choose blue logos to appear:", options: ["A) innovative", "B) trustworthy", "C) exciting", "D) affordable"], correctAnswer: "B" },
    { id: "r2-14", type: "sentence-completion", question: "Athletes facing opponents in red may perform slightly _____.", correctAnswer: "worse" },
  ]
};

export const readingPassage3: IELTSReadingPassage = {
  id: "r3",
  title: "Sleep and Memory Consolidation",
  content: `The relationship between sleep and memory has fascinated scientists for over a century. Modern research has revealed that sleep is not merely a passive state of rest but an active process during which the brain consolidates, organises, and integrates newly acquired information with existing knowledge.

Memory consolidation refers to the process by which temporary, fragile memories are transformed into stable, long-term memories. This process appears to depend critically on sleep, with different sleep stages playing distinct roles in consolidating different types of memories.

During deep sleep, characterised by slow brain waves, the hippocampus repeatedly replays recent experiences, strengthening neural connections associated with declarative memories—facts, events, and experiences that can be consciously recalled. Studies using functional brain imaging have shown this replay occurring during slow-wave sleep, with the strength of replay correlating with memory retention.

Rapid eye movement (REM) sleep, the stage associated with vivid dreaming, appears particularly important for procedural and emotional memories. Skills learned during the day, from playing a musical instrument to performing a athletic movement, show improved execution after REM sleep. Emotional memories also undergo processing during this stage, potentially helping regulate emotional responses.

The timing of sleep relative to learning matters significantly. The first half of the night, dominated by deep sleep, may be most beneficial for factual learning. The second half, with more REM sleep, may better serve skill acquisition and emotional processing. This has practical implications for students and professionals seeking to optimise learning.

Sleep deprivation severely impairs memory consolidation. Even partial sleep restriction over several nights can significantly reduce learning capacity. More concerning, sleep-deprived individuals often fail to recognise their impaired cognitive state, leading to overconfidence in faulty memories or decisions.

Research has also revealed that sleep before learning is equally important. A sleep-deprived brain struggles to encode new information effectively, as the hippocampus requires adequate rest to function optimally. This explains why cramming through the night before an exam often produces disappointing results.

Interestingly, targeted memory reactivation during sleep has shown promise as a technique for enhancing memory consolidation. By presenting subtle cues associated with learned material during sleep—such as odours or sounds—researchers have demonstrated improved recall upon waking. This technique is being explored for potential therapeutic applications.

The elderly typically experience less deep sleep, which may partly explain age-related memory decline. Understanding the sleep-memory relationship opens possibilities for interventions to improve memory function in aging populations. Exercise, consistent sleep schedules, and avoidance of sleep-disrupting substances all support healthy sleep architecture and, by extension, memory consolidation.

As our understanding of sleep's role in memory continues to develop, the message is increasingly clear: adequate, quality sleep is not a luxury but a necessity for cognitive function and learning. In a society that often undervalues sleep, this research provides compelling evidence for prioritising rest.`,
  questions: [
    { id: "r3-1", type: "true-false-not-given", question: "Sleep is primarily a passive resting state for the brain.", correctAnswer: "FALSE" },
    { id: "r3-2", type: "sentence-completion", question: "Memory _____ is the process of transforming temporary memories into stable ones.", correctAnswer: "consolidation" },
    { id: "r3-3", type: "multiple-choice", question: "Deep sleep is characterised by:", options: ["A) rapid eye movements", "B) vivid dreaming", "C) slow brain waves", "D) muscle paralysis"], correctAnswer: "C" },
    { id: "r3-4", type: "true-false-not-given", question: "The hippocampus replays experiences during slow-wave sleep.", correctAnswer: "TRUE" },
    { id: "r3-5", type: "sentence-completion", question: "REM sleep is particularly important for _____ and emotional memories.", correctAnswer: "procedural" },
    { id: "r3-6", type: "matching-information", question: "Which type of sleep dominates the first half of the night?", options: ["A) Light sleep", "B) Deep sleep", "C) REM sleep", "D) Transitional sleep"], correctAnswer: "B" },
    { id: "r3-7", type: "true-false-not-given", question: "Sleep-deprived people are usually aware of their impaired state.", correctAnswer: "FALSE" },
    { id: "r3-8", type: "sentence-completion", question: "Studying through the night before exams often produces _____ results.", correctAnswer: "disappointing" },
    { id: "r3-9", type: "multiple-choice", question: "Targeted memory reactivation uses _____ during sleep:", options: ["A) electrical stimulation", "B) medication", "C) subtle cues like odours", "D) light therapy"], correctAnswer: "C" },
    { id: "r3-10", type: "true-false-not-given", question: "The elderly experience more deep sleep than younger adults.", correctAnswer: "FALSE" },
    { id: "r3-11", type: "sentence-completion", question: "The _____ requires adequate rest to encode new information effectively.", correctAnswer: "hippocampus" },
    { id: "r3-12", type: "multiple-choice", question: "According to the passage, the message about sleep is:", options: ["A) sleep needs vary greatly", "B) 6 hours is sufficient", "C) quality sleep is essential", "D) daytime naps replace night sleep"], correctAnswer: "C" },
    { id: "r3-13", type: "true-false-not-given", question: "Exercise can support healthy sleep patterns.", correctAnswer: "TRUE" },
  ]
};

// All reading questions combined
export const allReadingQuestions: IELTSReadingQuestion[] = [
  ...readingPassage1.questions,
  ...readingPassage2.questions,
  ...readingPassage3.questions,
];

// Writing Tasks
export const writingTask1Samples: IELTSWritingTask[] = [
  {
    id: "w1-1",
    task: 1,
    type: "bar-chart",
    prompt: "The bar chart below shows the percentage of households with access to the internet in four different countries between 2010 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
    chartDescription: "Bar chart showing internet access rates: UK (85% to 96%), Germany (82% to 94%), Brazil (41% to 81%), India (7.5% to 50%) from 2010-2020",
    minWords: 150,
    sampleAnswer: "The bar chart illustrates the proportion of households with internet access in the UK, Germany, Brazil, and India over a ten-year period from 2010 to 2020.\n\nOverall, all four nations experienced significant growth in internet connectivity, though substantial disparities remained. The UK and Germany consistently led, while India, despite impressive growth, remained the least connected.\n\nIn 2010, the UK had the highest rate at 85%, closely followed by Germany at 82%. Brazil showed moderate connectivity at 41%, whereas India had merely 7.5% of households online. By 2020, all countries had improved considerably: the UK reached 96%, Germany 94%, Brazil 81%, and India 50%.\n\nNotably, India demonstrated the most dramatic increase, nearly seven times its 2010 figure, while Brazil more than doubled its connectivity rate. The developed nations maintained high levels throughout, with more modest but steady growth of approximately 10-12 percentage points each."
  },
  {
    id: "w1-2",
    task: 1,
    type: "line-graph",
    prompt: "The line graph below shows the average monthly temperatures in three cities over a one-year period.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
    chartDescription: "Line graph showing temperatures: Sydney (summer Dec-Feb ~25°C, winter Jun-Aug ~15°C), London (summer Jun-Aug ~20°C, winter Dec-Feb ~5°C), Singapore (constant ~28°C year-round)",
    minWords: 150,
  },
  {
    id: "w1-3",
    task: 1,
    type: "pie-chart",
    prompt: "The pie charts below show the distribution of household expenditure in a typical UK family in 1970 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
    chartDescription: "Pie charts: 1970 (Housing 25%, Food 35%, Transport 10%, Entertainment 8%, Other 22%) vs 2020 (Housing 38%, Food 15%, Transport 18%, Entertainment 12%, Other 17%)",
    minWords: 150,
  },
];

export const writingTask2Samples: IELTSWritingTask[] = [
  {
    id: "w2-1",
    task: 2,
    type: "essay",
    prompt: "Some people believe that social media has improved communication between people, while others think it has made people more isolated.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.",
    minWords: 250,
  },
  {
    id: "w2-2",
    task: 2,
    type: "essay",
    prompt: "Many universities now offer online degree programmes. Some people argue this will replace traditional campus-based learning entirely.\n\nTo what extent do you agree or disagree?\n\nWrite at least 250 words.",
    minWords: 250,
  },
  {
    id: "w2-3",
    task: 2,
    type: "essay",
    prompt: "In many countries, the gap between rich and poor is increasing. What problems does this cause, and what solutions can be implemented?\n\nWrite at least 250 words.",
    minWords: 250,
  },
];

// Speaking Prompts
export const speakingPart1: IELTSSpeakingPrompt[] = [
  { id: "s1-1", part: 1, prompt: "Do you work or are you a student?" },
  { id: "s1-2", part: 1, prompt: "What do you enjoy most about your hometown?" },
  { id: "s1-3", part: 1, prompt: "How often do you use public transport?" },
  { id: "s1-4", part: 1, prompt: "What kind of music do you like?" },
  { id: "s1-5", part: 1, prompt: "Do you prefer to spend time alone or with others?" },
  { id: "s1-6", part: 1, prompt: "What is your favourite way to relax?" },
  { id: "s1-7", part: 1, prompt: "How important is family to you?" },
  { id: "s1-8", part: 1, prompt: "What kinds of food do you like to eat?" },
];

export const speakingPart2: IELTSSpeakingPrompt[] = [
  {
    id: "s2-1",
    part: 2,
    prompt: "Describe a skill you would like to learn.",
    cueCardPoints: [
      "What the skill is",
      "Why you want to learn it",
      "How you would learn it",
      "How this skill would be useful"
    ],
    followUpQuestions: [
      "Is learning new skills important for adults?",
      "What skills are most valued in your country?"
    ]
  },
  {
    id: "s2-2",
    part: 2,
    prompt: "Describe a memorable journey you have taken.",
    cueCardPoints: [
      "Where you went",
      "Who you travelled with",
      "What you did there",
      "Why it was memorable"
    ],
    followUpQuestions: [
      "Why do people like to travel?",
      "How has travel changed in recent years?"
    ]
  },
  {
    id: "s2-3",
    part: 2,
    prompt: "Describe a person who has influenced you.",
    cueCardPoints: [
      "Who this person is",
      "How you know them",
      "What they have done",
      "How they influenced you"
    ],
    followUpQuestions: [
      "Who influences young people today?",
      "Are role models important?"
    ]
  },
];

export const speakingPart3: IELTSSpeakingPrompt[] = [
  { id: "s3-1", part: 3, prompt: "Why do you think some people are afraid of trying new things?" },
  { id: "s3-2", part: 3, prompt: "How has technology changed the way we learn?" },
  { id: "s3-3", part: 3, prompt: "What are the advantages and disadvantages of living in a big city?" },
  { id: "s3-4", part: 3, prompt: "Do you think traditional jobs will disappear in the future?" },
  { id: "s3-5", part: 3, prompt: "Should governments invest more in public transport?" },
];

// Helper functions
export const getQuestionsBySection = (section: 1 | 2 | 3 | 4): IELTSListeningQuestion[] => {
  return allListeningQuestions.filter(q => q.section === section);
};

export const getQuestionsByAccent = (accent: "british" | "american" | "australian"): IELTSListeningQuestion[] => {
  return allListeningQuestions.filter(q => q.accent === accent);
};

export const getRandomQuestions = (count: number, pool: any[]): any[] => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getFullListeningMock = (): IELTSListeningQuestion[] => {
  return allListeningQuestions; // 40 questions
};

export const getHalfListeningMock = (): IELTSListeningQuestion[] => {
  // Return sections 1 and 2 (20 questions)
  return [...listeningSection1, ...listeningSection2];
};

export const getFullReadingMock = (): { passages: IELTSReadingPassage[], totalQuestions: number } => {
  return {
    passages: [readingPassage1, readingPassage2, readingPassage3],
    totalQuestions: 40
  };
};

export const getReadingByType = (type: IELTSReadingQuestion["type"]): IELTSReadingQuestion[] => {
  return allReadingQuestions.filter(q => q.type === type);
};
