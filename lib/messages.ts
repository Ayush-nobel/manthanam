export interface Message {
  /** Also the photo file name: public/messages/<slug>.{jpg,jpeg,png,webp,avif}. */
  slug: string;
  /** Exactly as received. */
  quote: string;
  name: string;
  /** Position or office; leave "" when none was given. */
  title?: string;
  /** "hi" renders the quote with lang="hi" in the Devanagari font. Default "en". */
  lang?: "en" | "hi";
  /**
   * Only verified messages are published. Set to true once the sender has confirmed the
   * exact wording and given permission to publish it with their name and photo.
   */
  verified: boolean;
}

export const messages: Message[] = [
  {
    slug: "khatua",
    name: "Ambassador Amarendra Khatua, IFS (Retd.)",
    title: "",
    quote:
      "My best wishes to Manthanam Research Foundation and its entire team. I appreciate their commitment to fostering youth leadership, strengthening international understanding, and encouraging meaningful dialogue on issues of national and global importance. May Manthanam continue to grow and inspire the next generation of leaders.",
    verified: false,
  },
  {
    slug: "seetharam",
    name: "Ambassador T. P. Seetharam, IFS (Retd.)",
    quote:
      "I extend my sincere best wishes to Manthanam Research Foundation for its endeavours. Initiatives that encourage young minds to understand diplomacy, international relations and global cooperation are valuable in shaping future generations. I wish the organisation continued success in its mission.",
    verified: false,
  },
  {
    slug: "ranganathan",
    name: "Dr. Anand Ranganathan",
    title: "Scientist",
    quote:
      "My best wishes to Manthanam Research Foundation and its young, dynamic team. It is encouraging to see young minds taking an active interest in research, intellectual discourse and nation-building. May the organisation continue to pursue its vision with curiosity, conviction and excellence.",
    verified: false,
  },
  {
    slug: "trigunayat",
    name: "Ambassador Anil Trigunayat, IFS (Retd.)",
    quote:
      "I appreciate the vision and initiative of Manthanam Research Foundation in promoting strategic awareness, international engagement and youth participation. My best wishes to the entire team for their dedication and continued efforts towards building an informed and globally conscious generation.",
    verified: false,
  },
  {
    slug: "chouhan",
    lang: "hi",
    name: "Shri Shivraj Singh Chouhan",
    title: "Union Cabinet Minister of Agriculture & Farmers Welfare and Rural Development, Government of India",
    quote:
      "मंथनम रिसर्च फाउंडेशन की पूरी टीम को हार्दिक शुभकामनाएँ। युवाओं को राष्ट्र निर्माण, नेतृत्व और सकारात्मक विचारों से जोड़ने का आपका प्रयास सराहनीय है। मेरा विश्वास है कि युवा शक्ति विकसित भारत के संकल्प को साकार करने में महत्वपूर्ण भूमिका निभाएगी।",
    verified: false,
  },
  {
    slug: "dubey",
    lang: "hi",
    name: "Shri Satish Chandra Dubey",
    title: "Minister of State for Coal and Mines, Government of India",
    quote:
      "मंथनम रिसर्च फाउंडेशन के इस सराहनीय प्रयास के लिए पूरी टीम को मेरी शुभकामनाएँ। युवाओं में शोध, चिंतन और राष्ट्रीय विषयों के प्रति जागरूकता विकसित करना अत्यंत आवश्यक है। आशा है कि आपका संस्थान राष्ट्रहित में निरंतर सार्थक योगदान देगा।",
    verified: false,
  },
  {
    slug: "paswan",
    name: "Shri Chirag Paswan",
    title: "Union Cabinet Minister of Food Processing Industries, Government of India",
    quote:
      "My sincere best wishes to Manthanam Research Foundation. Youth participation, innovation and entrepreneurship are essential pillars of a progressive and self-reliant India. I appreciate initiatives that encourage young minds to think constructively and contribute meaningfully to the nation's development. Wishing the entire team continued success.",
    verified: false,
  },
];
