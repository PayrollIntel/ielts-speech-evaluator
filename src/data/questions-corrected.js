// Updated IELTS Speaking Test Question Repository - Corrected IELTS Format
// Structure: Part 1 (7-8 questions), Part 2 (1 cue card), Part 3 (4-6 discussion questions)

const questionBank = {
  
  // PART 1: INTRODUCTION & INTERVIEW QUESTIONS (4-5 minutes)
  // 7-8 questions from 2-3 different familiar topics
  part1Topics: [
    {
      topicName: "Work/Study",
      questions: [
        {
          id: "work_001",
          prompt: "Do you work or are you a student?",
          followUp: ["What do you do for work?", "What do you study?"]
        },
        {
          id: "work_002", 
          prompt: "Do you like your job/subject?",
          followUp: ["Why do you like it?", "What's the best part of your job/studies?"]
        },
        {
          id: "work_003",
          prompt: "Is it a popular job/subject in your country?",
          followUp: ["Why is it popular?", "Do many people choose this field?"]
        },
        {
          id: "work_004",
          prompt: "What was your first day like at work/university?",
          followUp: ["How did you feel?", "What do you remember most?"]
        }
      ]
    },
    {
      topicName: "Hometown",
      questions: [
        {
          id: "hometown_001",
          prompt: "Where is your hometown?",
          followUp: ["How long have you lived there?"]
        },
        {
          id: "hometown_002",
          prompt: "What do you like most about your hometown?",
          followUp: ["Why do you like that particular aspect?"]
        },
        {
          id: "hometown_003", 
          prompt: "Has your hometown changed much over the years?",
          followUp: ["What changes have you noticed?", "Are these changes positive?"]
        },
        {
          id: "hometown_004",
          prompt: "What's the weather like in your hometown?",
          followUp: ["Which season do you prefer there?"]
        }
      ]
    },
    {
      topicName: "Hobbies & Free Time",
      questions: [
        {
          id: "hobbies_001",
          prompt: "What do you like to do in your free time?",
          followUp: ["How often do you do these activities?"]
        },
        {
          id: "hobbies_002",
          prompt: "Do you have any hobbies?", 
          followUp: ["When did you start this hobby?", "Why do you enjoy it?"]
        },
        {
          id: "hobbies_003",
          prompt: "Do you prefer indoor or outdoor activities?",
          followUp: ["Why do you prefer them?"]
        },
        {
          id: "hobbies_004",
          prompt: "Have your hobbies changed since you were a child?",
          followUp: ["How have they changed?", "Why did they change?"]
        }
      ]
    },
    {
      topicName: "Food & Cooking",
      questions: [
        {
          id: "food_001",
          prompt: "What's your favorite type of food?",
          followUp: ["Why do you like this type of food?"]
        },
        {
          id: "food_002",
          prompt: "Do you like cooking?",
          followUp: ["What do you like to cook?", "Who taught you to cook?"]
        },
        {
          id: "food_003",
          prompt: "Do you prefer home-cooked food or restaurant food?",
          followUp: ["Why do you prefer it?"]
        },
        {
          id: "food_004",
          prompt: "Have your eating habits changed over the years?",
          followUp: ["How have they changed?", "What caused these changes?"]
        }
      ]
    },
    {
      topicName: "Technology",
      questions: [
        {
          id: "tech_001",
          prompt: "Do you use technology a lot?",
          followUp: ["What technology do you use most?"]
        },
        {
          id: "tech_002",
          prompt: "What's your favorite piece of technology?",
          followUp: ["Why is it your favorite?", "How often do you use it?"]
        },
        {
          id: "tech_003",
          prompt: "Has technology changed your life?",
          followUp: ["In what ways?", "Are these changes positive?"]
        },
        {
          id: "tech_004",
          prompt: "What new technology would you like to learn about?",
          followUp: ["Why are you interested in it?"]
        }
      ]
    },
    {
      topicName: "Family & Friends",
      questions: [
        {
          id: "family_001",
          prompt: "Tell me about your family.",
          followUp: ["Who are you closest to in your family?"]
        },
        {
          id: "family_002",
          prompt: "Do you have a large or small family?",
          followUp: ["Do you prefer it this way?"]
        },
        {
          id: "family_003",
          prompt: "How much time do you spend with your family?",
          followUp: ["What do you usually do together?"]
        },
        {
          id: "family_004",
          prompt: "Do you have many close friends?",
          followUp: ["How did you meet your best friend?"]
        }
      ]
    }
  ],

  // PART 2: CUE CARD TOPICS (Individual Long Turn - 3-4 minutes)
  // 1 minute preparation + 1-2 minutes speaking
  part2CueCards: [
    {
      id: "cue_person_001",
      category: "Person",
      topic: "Describe a person who has influenced you",
      cueCard: {
        mainPrompt: "Describe a person who has influenced you",
        bulletPoints: [
          "Who this person is",
          "How you know them", 
          "What they have done to influence you",
          "And explain why this person has been important in your life"
        ]
      },
      preparationTime: 60, // seconds
      speakingTime: [60, 120], // min and max seconds
      sampleAnswer: "I'd like to talk about my high school English teacher, Mrs. Johnson, who had a profound influence on my life. I first met her when I was 15 years old, and she taught me for two years during my crucial formative period. What made Mrs. Johnson so influential was her unique approach to teaching and her genuine care for her students. She didn't just teach us grammar and literature; she taught us how to think critically and express ourselves confidently. She encouraged me to participate in debate competitions and helped me discover my passion for public speaking. Mrs. Johnson also taught me the importance of perseverance when I was struggling with a particularly difficult essay assignment. Instead of giving me the answers, she guided me through the process of research and critical thinking. This person has been important in my life because she shaped not only my academic abilities but also my character. Her influence extends far beyond the classroom, and the confidence and analytical skills she helped me develop have been invaluable in both my personal and professional life."
    },
    {
      id: "cue_place_001", 
      category: "Place",
      topic: "Describe a place you visited that left a strong impression on you",
      cueCard: {
        mainPrompt: "Describe a place you visited that left a strong impression on you",
        bulletPoints: [
          "Where this place is",
          "When you visited it",
          "What you did there", 
          "And explain why it left such a strong impression on you"
        ]
      },
      preparationTime: 60,
      speakingTime: [60, 120],
      sampleAnswer: "I'd like to describe the ancient city of Petra in Jordan, which I visited last summer during a Middle Eastern tour. Petra is located in southern Jordan and is famous for its rock-cut architecture and historical significance as a trading hub. I spent two full days exploring this UNESCO World Heritage site with a local guide. What struck me immediately was the dramatic entrance through the Siq, a narrow canyon that leads to the iconic Treasury building. The craftsmanship of the Nabataean people was absolutely breathtaking - seeing these elaborate facades carved directly into pink sandstone cliffs was unlike anything I'd ever experienced. During my visit, I hiked to the Monastery, climbed to various viewpoints, and learned about the sophisticated water management systems the ancient inhabitants had created. This place left such a strong impression on me because it combined natural beauty with human ingenuity in a way that felt almost magical. The scale and preservation of the site made history feel tangible and alive. It also made me realize how advanced ancient civilizations were and gave me a deep appreciation for cultural heritage preservation."
    },
    {
      id: "cue_experience_001",
      category: "Experience", 
      topic: "Describe a time when you learned something new",
      cueCard: {
        mainPrompt: "Describe a time when you learned something new",
        bulletPoints: [
          "What you learned",
          "When and where you learned it",
          "How you learned it",
          "And explain how this new knowledge has been useful to you"
        ]
      },
      preparationTime: 60,
      speakingTime: [60, 120],
      sampleAnswer: "I'd like to talk about when I learned how to play the piano, which happened about two years ago when I was 28 years old. I had always wanted to learn a musical instrument, but never had the opportunity until I moved into a new apartment where my neighbor happened to be a retired music teacher. I learned through a combination of formal lessons with my neighbor twice a week and daily practice sessions at home. She taught me music theory, proper finger positioning, and helped me progress from simple scales to playing actual songs. The learning process was challenging but incredibly rewarding. I started with basic exercises and gradually worked my way up to playing classical pieces like Bach's Inventions and some contemporary songs. What made the learning process special was the patience and encouragement of my teacher, who adapted her methods to suit my adult learning style. This new knowledge has been useful to me in several ways. Playing piano has become my primary stress-relief activity after long work days. It has also improved my cognitive abilities and memory, and given me a creative outlet that I never had before. Additionally, it's enhanced my appreciation for music and provided me with a skill I can share with others at social gatherings."
    },
    {
      id: "cue_object_001",
      category: "Object",
      topic: "Describe an important object that you own",
      cueCard: {
        mainPrompt: "Describe an important object that you own", 
        bulletPoints: [
          "What this object is",
          "How you got it",
          "What you use it for",
          "And explain why it is important to you"
        ]
      },
      preparationTime: 60,
      speakingTime: [60, 120],
      sampleAnswer: "I'd like to describe my grandmother's vintage camera, which is a 1960s Leica that she used throughout her career as a photojournalist. I inherited this camera when my grandmother passed away three years ago, along with several albums of photographs she had taken during her travels around the world. The camera itself is a beautiful piece of craftsmanship - it's made of black metal with silver accents and has that distinctive vintage aesthetic that modern cameras lack. I use this camera for special occasions and personal photography projects. Unlike digital cameras, it requires film, which makes each shot more deliberate and meaningful. I've learned to appreciate the process of manual focusing and adjusting settings based on lighting conditions. This object is important to me for several reasons. Firstly, it connects me to my grandmother's memory and her passion for documenting life's moments. Every time I hold it, I feel connected to her adventurous spirit and artistic eye. Secondly, using this camera has taught me patience and improved my photography skills because I have to think carefully about composition and lighting before taking each shot. Finally, it represents a slower, more mindful approach to photography that contrasts sharply with our instant digital world, and this has helped me become more present and observant in my daily life."
    },
    {
      id: "cue_event_001",
      category: "Event",
      topic: "Describe a celebration or festival that is important in your country",
      cueCard: {
        mainPrompt: "Describe a celebration or festival that is important in your country",
        bulletPoints: [
          "What the celebration/festival is",
          "When it takes place",
          "What people do during this celebration", 
          "And explain why it is important in your country"
        ]
      },
      preparationTime: 60,
      speakingTime: [60, 120],
      sampleAnswer: "I'd like to talk about Diwali, which is one of the most significant festivals in India and is celebrated by millions of people worldwide. Diwali, also known as the Festival of Lights, typically takes place in October or November, depending on the lunar calendar, and lasts for five days. During Diwali, people engage in numerous traditional activities. Homes and public spaces are decorated with colorful rangoli patterns, diyas (oil lamps), and string lights. Families clean and renovate their homes, believing this welcomes prosperity and good fortune. People exchange gifts, sweets, and greetings with friends, family, and neighbors. There are also spectacular fireworks displays, special prayers at temples, and elaborate feasts featuring traditional sweets and savory dishes. Markets become bustling with activity as people shop for new clothes, jewelry, and gifts. This festival is important in our country for several reasons. Culturally, it symbolizes the victory of light over darkness and good over evil, drawing from various Hindu mythological stories. Economically, it's crucial as it boosts retail sales, from clothing and jewelry to sweets and decorations. Socially, Diwali brings communities together, transcending religious and social boundaries as people of different backgrounds participate in the celebrations. It's also a time for family reunions, strengthening bonds between relatives who may live far apart. The festival embodies the values of generosity, gratitude, and renewal that are central to Indian culture."
    },
    {
      id: "cue_activity_001",
      category: "Activity",
      topic: "Describe a sport or physical activity you enjoy",
      cueCard: {
        mainPrompt: "Describe a sport or physical activity you enjoy",
        bulletPoints: [
          "What the sport/activity is",
          "When and where you do it",
          "Who you do it with",
          "And explain why you enjoy this activity"
        ]
      },
      preparationTime: 60,
      speakingTime: [60, 120], 
      sampleAnswer: "I'd like to talk about swimming, which has become my favorite physical activity over the past few years. Swimming is a full-body workout that I find both challenging and relaxing at the same time. I typically swim three times a week at the local community pool, usually in the early morning before work starts. The pool opens at 6 AM, and I find that morning swimming gives me energy and focus for the entire day. Sometimes I swim alone, which I actually prefer because it gives me time to think and clear my mind, but occasionally I join group swimming sessions organized by the fitness center. I enjoy swimming for multiple reasons. Physically, it's an excellent cardiovascular workout that strengthens my entire body without putting stress on my joints, which is important since I spend most of my day sitting at a computer. The rhythmic nature of swimming - the breathing, the strokes, the movement through water - has a meditative quality that helps reduce my stress levels significantly. I also love the sensation of being in water; there's something peaceful about the way sound is muffled and how weightless you feel. Additionally, swimming has helped me build discipline and set personal goals, whether it's improving my technique, increasing my endurance, or swimming longer distances. It's become not just a form of exercise, but a crucial part of my mental health and overall well-being routine."
    }
  ],

  // PART 3: DISCUSSION QUESTIONS (Two-way Discussion - 4-5 minutes)
  // 4-6 abstract questions related to Part 2 topic
  part3Discussions: [
    {
      relatedToPart2: "cue_person_001", // Person who influenced you
      topicTheme: "Influence and Role Models",
      questions: [
        {
          id: "disc_person_001",
          prompt: "What kinds of people become role models in society?",
          type: "general_analysis"
        },
        {
          id: "disc_person_002", 
          prompt: "Do you think social media influencers have a positive or negative impact on young people?",
          type: "opinion_evaluation"
        },
        {
          id: "disc_person_003",
          prompt: "How has the concept of role models changed over the past few decades?",
          type: "comparison_analysis"
        },
        {
          id: "disc_person_004",
          prompt: "Should celebrities have a responsibility to be good role models?",
          type: "opinion_evaluation"
        },
        {
          id: "disc_person_005",
          prompt: "What role do teachers play in shaping young people's future?",
          type: "role_analysis"
        },
        {
          id: "disc_person_006",
          prompt: "Do you think people need role models to be successful in life?",
          type: "necessity_evaluation"
        }
      ]
    },
    {
      relatedToPart2: "cue_place_001", // Place that left impression
      topicTheme: "Travel and Cultural Heritage",
      questions: [
        {
          id: "disc_place_001",
          prompt: "Why do you think people are attracted to visiting historical places?",
          type: "motivation_analysis"
        },
        {
          id: "disc_place_002",
          prompt: "How important is it to preserve historical sites for future generations?",
          type: "importance_evaluation"
        },
        {
          id: "disc_place_003",
          prompt: "Do you think tourism can have negative effects on historical places?",
          type: "impact_analysis"
        },
        {
          id: "disc_place_004",
          prompt: "How has tourism changed in your country over the past 20 years?",
          type: "change_analysis"
        },
        {
          id: "disc_place_005",
          prompt: "What can governments do to promote sustainable tourism?",
          type: "solution_proposal"
        },
        {
          id: "disc_place_006",
          prompt: "Do you think virtual reality could replace actual travel in the future?",
          type: "future_prediction"
        }
      ]
    },
    {
      relatedToPart2: "cue_experience_001", // Learning something new
      topicTheme: "Learning and Education",
      questions: [
        {
          id: "disc_learning_001",
          prompt: "What are the benefits of lifelong learning?",
          type: "benefit_analysis"
        },
        {
          id: "disc_learning_002",
          prompt: "Is it easier for children or adults to learn new skills?",
          type: "comparison_analysis"
        },
        {
          id: "disc_learning_003", 
          prompt: "How has technology changed the way people learn?",
          type: "change_analysis"
        },
        {
          id: "disc_learning_004",
          prompt: "What role should governments play in adult education?",
          type: "role_analysis"
        },
        {
          id: "disc_learning_005",
          prompt: "Do you think traditional classroom learning will become obsolete?",
          type: "future_prediction"
        },
        {
          id: "disc_learning_006",
          prompt: "Why do some people find it difficult to learn new things as they get older?",
          type: "problem_analysis"
        }
      ]
    },
    {
      relatedToPart2: "cue_object_001", // Important object
      topicTheme: "Material Possessions and Values",
      questions: [
        {
          id: "disc_object_001",
          prompt: "Do you think people today are too materialistic?",
          type: "opinion_evaluation"
        },
        {
          id: "disc_object_002",
          prompt: "How do possessions reflect a person's personality or values?",
          type: "relationship_analysis"
        },
        {
          id: "disc_object_003",
          prompt: "What is the difference between wanting something and needing something?",
          type: "concept_differentiation"
        },
        {
          id: "disc_object_004",
          prompt: "How has consumer culture changed in recent years?",
          type: "change_analysis"
        },
        {
          id: "disc_object_005",
          prompt: "What impact does advertising have on people's purchasing decisions?",
          type: "impact_analysis"
        },
        {
          id: "disc_object_006",
          prompt: "Do you think the concept of ownership will change in the future?",
          type: "future_prediction"
        }
      ]
    },
    {
      relatedToPart2: "cue_event_001", // Festival/Celebration
      topicTheme: "Culture and Traditions",
      questions: [
        {
          id: "disc_culture_001",
          prompt: "How important is it for countries to maintain their cultural traditions?",
          type: "importance_evaluation"
        },
        {
          id: "disc_culture_002",
          prompt: "Do you think globalization is affecting local cultures negatively?",
          type: "impact_analysis"
        },
        {
          id: "disc_culture_003",
          prompt: "What role do festivals play in bringing communities together?",
          type: "role_analysis"
        },
        {
          id: "disc_culture_004",
          prompt: "How can traditional festivals adapt to modern times without losing their meaning?",
          type: "adaptation_analysis"
        },
        {
          id: "disc_culture_005",
          prompt: "Do you think younger generations are less interested in cultural traditions?",
          type: "generational_analysis"
        },
        {
          id: "disc_culture_006", 
          prompt: "What can governments do to preserve cultural heritage?",
          type: "solution_proposal"
        }
      ]
    },
    {
      relatedToPart2: "cue_activity_001", // Sport/Physical Activity
      topicTheme: "Health and Lifestyle", 
      questions: [
        {
          id: "disc_health_001",
          prompt: "Why do you think physical fitness has become more important in recent years?",
          type: "trend_analysis"
        },
        {
          id: "disc_health_002",
          prompt: "What are the main barriers that prevent people from exercising regularly?",
          type: "problem_analysis"
        },
        {
          id: "disc_health_003",
          prompt: "Do you think governments should do more to promote healthy lifestyles?",
          type: "policy_opinion"
        },
        {
          id: "disc_health_004",
          prompt: "How has the fitness industry changed over the past decade?",
          type: "change_analysis"
        },
        {
          id: "disc_health_005",
          prompt: "What role does mental health play in physical fitness?",
          type: "relationship_analysis"
        },
        {
          id: "disc_health_006",
          prompt: "Do you think competitive sports put too much pressure on young athletes?",
          type: "evaluation_analysis"
        }
      ]
    }
  ]
};

// Export the question bank
export default questionBank;