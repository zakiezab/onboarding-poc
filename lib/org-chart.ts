// Real Mobizinc company roster, transcribed from assets/org_chart.pdf (a
// BambooHR org-chart export). Names, titles, departments and locations are
// read directly off that chart. Reporting lines below the first two levels
// are best-effort: the source is a flattened chart image, not structured
// HRIS data, and BambooHR's compact layout stacks several direct reports in
// one column to save width, which is occasionally ambiguous to reconstruct
// from pixels alone. The CEO and all 14 of their direct reports are
// confirmed exactly (14 matches the chart's own badge count); deeper
// placements favor "visually and organizationally plausible" over
// guaranteed-exact where the source was ambiguous.
//
// This is a snapshot, not a live HRIS feed — re-pull from the real chart
// (or, better, a BambooHR export/API) before treating it as current.

export type Person = {
  id: string;
  name: string;
  title: string;
  department: string;
  location: string;
  managerId: string | null;
};

export const ORG_PEOPLE: Person[] = [
  // ---------- CEO ----------
  { id: 'hamad-riaz', name: 'Hamad Riaz', title: 'Chief Executive Officer', department: 'Admin', location: 'In-Office · Houston, TX', managerId: null },

  // ---------- Level 1 — CEO's 14 direct reports (confirmed) ----------
  { id: 'brittany-caldwell', name: 'Brittany Caldwell', title: 'Chief of Staff', department: 'Admin', location: 'In-Office · Houston, TX', managerId: 'hamad-riaz' },
  { id: 'naeim-darvish-beigi', name: 'Naeim Darvish Beigi', title: 'Team Lead, DevOps', department: 'DevOps Engineering', location: 'Remote · Oman', managerId: 'hamad-riaz' },
  { id: 'talib-dhanji', name: 'Talib Dhanji', title: 'CFO', department: 'Finance', location: 'In-Office · Houston, TX', managerId: 'hamad-riaz' },
  { id: 'scott-ditchey', name: 'Scott Ditchey', title: 'Head of Strategy & Business Development', department: 'Strategy Consulting', location: 'Remote · US, New Jersey', managerId: 'hamad-riaz' },
  { id: 'akber-gardezi', name: 'Dr. Akber Gardezi', title: 'Regional Technical Director', department: 'Innovation COE', location: 'In-Office · Islamabad, Pakistan', managerId: 'hamad-riaz' },
  { id: 'dolat-hamza', name: 'Dolat Hamza', title: 'Front End Developer', department: 'Product Development', location: 'In-Office · Islamabad, Pakistan', managerId: 'hamad-riaz' },
  { id: 'wajiha-ilyas', name: 'Wajiha Ilyas', title: 'AI Engineer', department: 'Data and AI', location: 'In-Office · Islamabad, Pakistan', managerId: 'hamad-riaz' },
  { id: 'meer-hashaam-khan', name: 'Meer Hashaam Khan', title: 'Junior Full Stack Developer', department: 'Product Development', location: 'In-Office · Islamabad, Pakistan', managerId: 'hamad-riaz' },
  { id: 'priyank-panchal', name: 'Priyank Panchal', title: 'Senior Manager, Software Engineering', department: 'Software Engineering', location: 'Remote · Canada, ON', managerId: 'hamad-riaz' },
  { id: 'mahnoor-safeer-abbasi', name: 'Mahnoor Safeer Abbasi', title: 'Junior AI Engineer', department: 'Data and AI', location: 'In-Office · Islamabad, Pakistan', managerId: 'hamad-riaz' },
  { id: 'vitaliy-savranskiy', name: 'Vitaliy Savranskiy', title: 'Director of Engineering', department: 'Systems Engineering', location: 'Remote · Ukraine', managerId: 'hamad-riaz' },
  { id: 'farman-ul-haq', name: 'Farman Ul Haq', title: 'AI Engineer', department: 'Data and AI', location: 'In-Office · Islamabad, Pakistan', managerId: 'hamad-riaz' },
  { id: 'shakeel-waqas', name: 'Shakeel Waqas', title: 'Channel Partner Manager', department: 'Sales Engineering', location: 'In-Office · Islamabad, Pakistan', managerId: 'hamad-riaz' },
  { id: 'scott-wiseman', name: 'Scott Wiseman', title: 'Head of Sales, US', department: 'Sales', location: 'Remote · US, Florida', managerId: 'hamad-riaz' },

  // ---------- Brittany Caldwell's branch: Admin / Accounting / HR ----------
  { id: 'hamza-aziz', name: 'Hamza Aziz', title: 'Accounting Assistant', department: 'Accounting', location: 'In-Office · Islamabad, Pakistan', managerId: 'brittany-caldwell' },
  { id: 'mirella-paulucci', name: 'Mirella Paulucci', title: 'HR Director', department: 'Human Resources', location: 'Remote · Canada, AB', managerId: 'brittany-caldwell' },
  { id: 'hajra-ghulam-mohammad', name: 'Hajra Ghulam Mohammad', title: 'Accounting Assistant', department: 'Accounting', location: 'In-Office · Karachi, Pakistan', managerId: 'brittany-caldwell' },
  { id: 'gina-reyna', name: 'Gina Reyna', title: 'Executive Assistant', department: 'Admin', location: 'In-Office · Houston, TX', managerId: 'brittany-caldwell' },
  { id: 'stacey-martello', name: 'Stacey Martello', title: 'Staff Accountant', department: 'Accounting', location: 'In-Office · Houston, TX', managerId: 'brittany-caldwell' },
  { id: 'abuzar-subhani', name: 'Abuzar Subhani', title: 'Senior Accountant', department: 'Accounting', location: 'In-Office · Islamabad, Pakistan', managerId: 'brittany-caldwell' },

  // ---------- Naeim Darvish Beigi's branch: DevOps Engineering ----------
  { id: 'thej-rayasam', name: 'Thej Rayasam', title: 'DevOps Engineer', department: 'DevOps Engineering', location: 'Remote · Canada, ON', managerId: 'naeim-darvish-beigi' },
  { id: 'navid-darvish-beygi', name: 'Navid Darvish Beygi', title: 'Junior DevOps Engineer', department: 'DevOps Engineering', location: 'Remote · Oman', managerId: 'naeim-darvish-beigi' },
  { id: 'sean-gonzales', name: 'Sean Gonzales', title: 'DevOps Engineer', department: 'DevOps Engineering', location: 'Remote · US, California', managerId: 'naeim-darvish-beigi' },
  { id: 'viacheslav-kuzmenko', name: 'Viacheslav Kuzmenko', title: 'DevOps Engineer', department: 'DevOps Engineering', location: 'Remote · Ukraine', managerId: 'naeim-darvish-beigi' },
  { id: 'muhammad-suhaib', name: 'Muhammad Suhaib', title: 'Junior DevOps Engineer', department: 'DevOps Engineering', location: 'In-Office · Islamabad, Pakistan', managerId: 'naeim-darvish-beigi' },
  { id: 'david-wang', name: 'David Wang', title: 'DevOps Engineer', department: 'DevOps Engineering', location: 'Remote · Canada, BC', managerId: 'naeim-darvish-beigi' },

  // ---------- Talib Dhanji's branch: Finance / Dynamics Practice ----------
  { id: 'marcel-pacano', name: 'Marcel Pacano', title: 'Project Manager', department: 'Dynamics Practice', location: 'Remote · Brazil', managerId: 'talib-dhanji' },
  { id: 'allan-wilson', name: 'Allan Wilson', title: 'Dynamics Practice', department: 'Dynamics Practice', location: 'Remote · US', managerId: 'talib-dhanji' },

  { id: 'yumna-asim', name: 'Yumna Asim', title: 'Technical Consultant, Dynamics', department: 'Dynamics Practice', location: 'In-Office · Islamabad, Pakistan', managerId: 'marcel-pacano' },
  { id: 'salik-mian', name: 'Salik Mian', title: 'Microsoft Dynamics Functional Consultant', department: 'Dynamics Practice', location: 'In-Office · Karachi, Pakistan', managerId: 'marcel-pacano' },
  { id: 'mudasir-ahmed', name: 'Mudasir Ahmed', title: 'Junior Analyst, Business Applications', department: 'Dynamics Practice', location: 'In-Office · Islamabad, Pakistan', managerId: 'yumna-asim' },
  { id: 'maaz-ashiq', name: 'Maaz Ashiq', title: 'Junior Analyst, Business Applications', department: 'Dynamics Practice', location: 'In-Office · Islamabad, Pakistan', managerId: 'yumna-asim' },
  { id: 'saman-ashraf', name: 'Saman Ashraf', title: 'Junior Analyst, Business Applications', department: 'Dynamics Practice', location: 'In-Office · Islamabad, Pakistan', managerId: 'yumna-asim' },
  { id: 'harris-ahmad', name: 'Harris Ahmad', title: 'Junior Analyst, Business Applications', department: 'Dynamics Practice', location: 'In-Office · Islamabad, Pakistan', managerId: 'salik-mian' },
  { id: 'hamza-rizwan', name: 'Hamza Rizwan', title: 'Junior Analyst, Business Applications', department: 'Dynamics Practice', location: 'In-Office · Islamabad, Pakistan', managerId: 'salik-mian' },

  { id: 'ana-paula-moreira-costa', name: 'Ana Paula Moreira Costa', title: 'Organizational Change Manager', department: 'Dynamics Practice', location: 'Remote · Brazil', managerId: 'allan-wilson' },
  { id: 'filipe-sbrana', name: 'Filipe Sbrana', title: 'D365 Solution Architect', department: 'Dynamics Practice', location: 'Remote', managerId: 'ana-paula-moreira-costa' },
  { id: 'hazem-abdelhalim', name: 'Hazem Abdelhalim', title: 'Senior Power Platform Developer', department: 'Dynamics Practice', location: 'Remote', managerId: 'allan-wilson' },
  { id: 'roger-bull', name: 'Roger Bull', title: 'D365 Architect', department: 'Dynamics Practice', location: 'Remote · South Africa', managerId: 'hazem-abdelhalim' },
  { id: 'ryno-engelbrecht', name: 'Ryno Engelbrecht', title: 'Microsoft Solution Architect', department: 'Dynamics Practice', location: 'Remote · South Africa', managerId: 'hazem-abdelhalim' },
  { id: 'aslam-khan', name: 'Aslam Khan', title: 'Power Platform Practice', department: 'Dynamics Practice', location: 'Remote · South Africa', managerId: 'hazem-abdelhalim' },
  { id: 'sean-konig', name: 'Sean Konig', title: 'Team Lead', department: 'Dynamics Practice', location: 'Remote · South Africa', managerId: 'allan-wilson' },
  { id: 'aleksandra-mutavdzic', name: 'Aleksandra Mutavdzic', title: 'Tech Lead', department: 'Dynamics Practice', location: 'Remote · South Africa', managerId: 'sean-konig' },
  { id: 'erno-nagy', name: 'Erno Nagy', title: 'D365 Architect', department: 'Dynamics Practice', location: 'Remote · South Africa', managerId: 'sean-konig' },
  { id: 'barend-oosthuizen', name: 'Barend Oosthuizen', title: 'Microsoft Solution Architect', department: 'Dynamics Practice', location: 'Remote · South Africa', managerId: 'sean-konig' },
  { id: 'renier-oosthuizen', name: 'Renier Oosthuizen', title: 'Microsoft Solution Architect', department: 'Dynamics Practice', location: 'Remote', managerId: 'allan-wilson' },
  { id: 'christo-opperman', name: 'Christo Opperman', title: 'Power Platform Developer', department: 'Dynamics Practice', location: 'Remote', managerId: 'renier-oosthuizen' },
  { id: 'ryno-page', name: 'Ryno Page', title: 'D365 Consultant', department: 'Dynamics Practice', location: 'Remote · South Africa', managerId: 'renier-oosthuizen' },
  { id: 'lionnel-tsuro', name: 'Lionnel Tsuro', title: 'Power Platform Developer', department: 'Dynamics Practice', location: 'Remote', managerId: 'renier-oosthuizen' },

  // ---------- Scott Ditchey's branch: Strategy Consulting / ServiceNow / Sales Engineering / Project Management / Marketing / Management Consulting ----------
  { id: 'patricia-carneiro', name: 'Patricia Carneiro', title: 'Strategy Consulting Lead', department: 'Dynamics Practice', location: 'Remote · Brazil', managerId: 'scott-ditchey' },
  { id: 'mike-jarvis', name: 'Mike Jarvis', title: 'Senior Client Partner', department: 'Dynamics Practice', location: 'Remote · US, California', managerId: 'patricia-carneiro' },

  { id: 'vladimir-blatin', name: 'Vladimir Blatin', title: 'Director, Sales Engineering', department: 'Sales Engineering', location: 'Remote · US, California', managerId: 'scott-ditchey' },
  { id: 'paul-aileku', name: 'Paul Aileku', title: 'Project Manager', department: 'Project Management', location: 'Remote · Canada, ON', managerId: 'vladimir-blatin' },
  { id: 'pamela-bezchinsky', name: 'Pamela Bezchinsky', title: 'Project Manager', department: 'Project Management', location: 'Remote · Argentina', managerId: 'paul-aileku' },
  { id: 'jenifar-kallul', name: 'Jenifar Kallul', title: 'Junior Business Systems Analyst', department: 'Management Consulting', location: 'In-Office · Houston, TX', managerId: 'paul-aileku' },
  { id: 'sebastian-krupkin', name: 'Sebastian Krupkin', title: 'Project Management Consultant', department: 'Project Management', location: 'Remote · Argentina', managerId: 'paul-aileku' },
  { id: 'bob-marquez', name: 'Bob Marquez', title: 'Business Systems Analyst', department: 'Management Consulting', location: 'Remote · US, California', managerId: 'vladimir-blatin' },
  { id: 'art-mikhailov', name: 'Art Mikhailov', title: 'Project Manager', department: 'Project Management', location: 'Remote · Canada, ON', managerId: 'bob-marquez' },
  { id: 'karina-vannucci-barrionovo', name: 'Karina Vannucci Barrionovo', title: 'Project Manager', department: 'Project Management', location: 'Remote · Brazil', managerId: 'bob-marquez' },
  { id: 'fares-arnous', name: 'Fares Arnous', title: 'ServiceNow Team Lead', department: 'ServiceNow', location: 'Remote · Canada, ON', managerId: 'ihor-kochetkov' },
  { id: 'ali-kummail', name: 'Ali Kummail', title: 'Junior ServiceNow Developer', department: 'ServiceNow', location: 'In-Office · Islamabad, Pakistan', managerId: 'fares-arnous' },
  { id: 'sashko-oliinyk', name: 'Sashko Oliinyk', title: 'ServiceNow Developer', department: 'ServiceNow', location: 'Remote · Ukraine', managerId: 'fares-arnous' },
  { id: 'viktor-bardakov', name: 'Viktor Bardakov', title: 'ServiceNow Manager', department: 'ServiceNow', location: 'Remote · Ukraine', managerId: 'ihor-kochetkov' },
  { id: 'sasha-khudan', name: 'Sasha Khudan', title: 'ServiceNow Developer', department: 'ServiceNow', location: 'Remote · Ukraine', managerId: 'viktor-bardakov' },
  { id: 'andrew-myroniuk', name: 'Andrew Myroniuk', title: 'ServiceNow Developer', department: 'ServiceNow', location: 'Remote · Ukraine', managerId: 'viktor-bardakov' },
  { id: 'serhii-riznyk', name: 'Serhii Riznyk', title: 'ServiceNow Developer', department: 'ServiceNow', location: 'Remote · Ukraine', managerId: 'viktor-bardakov' },
  { id: 'ahsan-zafar', name: 'Ahsan Zafar', title: 'Junior ServiceNow Developer', department: 'ServiceNow', location: 'In-Office · Islamabad, Pakistan', managerId: 'ihor-kochetkov' },

  { id: 'ihor-kochetkov', name: 'Ihor Kochetkov', title: 'ServiceNow Practice Lead', department: 'ServiceNow', location: 'Remote · Ukraine', managerId: 'scott-ditchey' },

  { id: 'victor-morassi', name: 'Victor Morassi', title: 'Practice Director, Management Consulting', department: 'Management Consulting', location: 'Remote · Brazil', managerId: 'scott-ditchey' },
  { id: 'durval-barbosa-da-cunha', name: 'Durval Barbosa da Cunha Jr.', title: 'Strategic Business & Analytics Consultant', department: 'Management Consulting', location: 'Remote · Brazil', managerId: 'victor-morassi' },
  { id: 'rick-botto', name: 'Rick Botto', title: 'Senior Project Manager', department: 'Project Management', location: 'Remote · US, New Jersey', managerId: 'durval-barbosa-da-cunha' },
  { id: 'katia-caldas-gouveia', name: 'Katia Caldas Gouveia', title: 'Senior Project Manager', department: 'Management Consulting', location: 'Remote · Brazil', managerId: 'durval-barbosa-da-cunha' },
  { id: 'max-carvalho', name: 'Max Carvalho', title: 'Strategic Business & Analytics Consultant', department: 'Management Consulting', location: 'Remote · Brazil', managerId: 'durval-barbosa-da-cunha' },
  { id: 'asiya-mazhar', name: 'Asiya Mazhar', title: 'IT Business Analyst', department: 'Project Management', location: 'In-Office · Karachi, Pakistan', managerId: 'victor-morassi' },
  { id: 'pedro-novaes', name: 'Pedro Novaes', title: 'Strategic Business & Analytics Consultant', department: 'Management Consulting', location: 'Remote · Brazil', managerId: 'asiya-mazhar' },
  { id: 'reinaldo-ozelin', name: 'Reinaldo Ozelin', title: 'Senior Project Manager', department: 'Management Consulting', location: 'Remote · Italy', managerId: 'asiya-mazhar' },
  { id: 'monica-ribeiro', name: 'Monica Ribeiro', title: 'Strategic Business & Analytics Consultant', department: 'Management Consulting', location: 'Remote · Brazil', managerId: 'asiya-mazhar' },
  { id: 'bruna-barros', name: 'Bruna Barros', title: 'Value Management Consultant', department: 'Strategy Consulting', location: 'Remote · Brazil', managerId: 'victor-morassi' },
  { id: 'sheila-de-souza', name: 'Sheila de Souza', title: 'Change Management Consultant', department: 'Management Consulting', location: 'Remote · Brazil', managerId: 'bruna-barros' },

  { id: 'alfredo-prieto', name: 'Alfredo Prieto', title: 'Strategy Consultant', department: 'Strategy Consulting', location: 'Remote · Brazil', managerId: 'scott-ditchey' },
  { id: 'yasmina-abuhendi', name: 'Yasmina Abuhendi', title: 'Regional Marketing Coordinator', department: 'Marketing', location: 'Remote · Bahrain', managerId: 'scott-ditchey' },
  { id: 'ygor-tazinaffo', name: 'Ygor Tazinaffo', title: 'Senior Project Manager', department: 'Project Management', location: 'Remote · Brazil', managerId: 'yasmina-abuhendi' },

  // ---------- Dr. Akber Gardezi's branch: Innovation COE / Design / Database Services / Management Consulting ----------
  { id: 'kamran-sikander', name: 'Kamran Sikander', title: 'Team Lead, DBA', department: 'Database Services', location: 'In-Office · Islamabad, Pakistan', managerId: 'akber-gardezi' },
  { id: 'junaid-akram', name: 'Junaid Akram', title: 'Data Engineer', department: 'BI Services', location: 'In-Office · Islamabad, Pakistan', managerId: 'kamran-sikander' },
  { id: 'hesham-habib', name: 'Hesham Habib', title: 'Power BI Developer', department: 'BI Services', location: 'In-Office · Islamabad, Pakistan', managerId: 'kamran-sikander' },
  { id: 'hasnat-butt', name: 'Hasnat Butt', title: 'SQL Database Administrator', department: 'Database Services', location: 'In-Office · Islamabad, Pakistan', managerId: 'kamran-sikander' },
  { id: 'muhammad-zeeshan-shahbaz', name: 'Muhammad Zeeshan Shahbaz', title: 'SQL Database Administrator', department: 'Database Services', location: 'In-Office · Islamabad, Pakistan', managerId: 'kamran-sikander' },
  { id: 'daniyal-faridi', name: 'Daniyal Faridi', title: 'Team Lead, Oracle', department: 'Database Services', location: 'In-Office · Karachi, Pakistan', managerId: 'kamran-sikander' },
  { id: 'sarmad-sultan', name: 'Sarmad Sultan', title: 'SQL Database Administrator', department: 'Database Services', location: 'In-Office · Islamabad, Pakistan', managerId: 'kamran-sikander' },

  { id: 'zakie-zabar', name: 'Zakie Zabar', title: 'Head of Design', department: 'Innovation COE', location: 'Remote · Malaysia', managerId: 'akber-gardezi' },
  { id: 'alya-mohamed', name: 'Alya Mohamed', title: 'Creative Multimedia Designer', department: 'Innovation COE', location: 'Remote · Malaysia', managerId: 'zakie-zabar' },

  { id: 'naseer-ahmed', name: 'Naseer Ahmed', title: 'Senior Director, Digital Transformation', department: 'Management Consulting', location: 'Remote · Saudi Arabia', managerId: 'akber-gardezi' },
  { id: 'nouf-al-afandi', name: 'Nouf Al-Afandi', title: 'Customer Success Manager', department: 'Management Consulting', location: 'In-Office · Saudi Arabia', managerId: 'naseer-ahmed' },
  { id: 'yasser-al-dhamary', name: 'Yasser Al-Dhamary', title: 'Team Lead, Networking', department: 'Systems Engineering', location: 'In-Office · Saudi Arabia', managerId: 'nouf-al-afandi' },
  { id: 'matar-al-juhani', name: 'Matar Al-Juhani', title: 'Customer Success Manager', department: 'Management Consulting', location: 'In-Office · Saudi Arabia', managerId: 'nouf-al-afandi' },

  { id: 'ali-al-musalami', name: 'Ali Al-Musalami', title: 'Customer Success Manager', department: 'Management Consulting', location: 'In-Office · Saudi Arabia', managerId: 'naseer-ahmed' },
  { id: 'yara-al-shammari', name: 'Yara Al-Shammari', title: 'Customer Success Executive', department: 'Management Consulting', location: 'In-Office · Saudi Arabia', managerId: 'ali-al-musalami' },
  { id: 'tareq-alghazzi', name: 'Tareq AlGhazzi', title: 'Head of Cloud Solution Architecture', department: 'Cloud Technology Unit', location: 'In-Office · Saudi Arabia', managerId: 'ali-al-musalami' },
  { id: 'samar-ayub', name: 'Samar Ayub', title: 'Project Manager', department: 'Project Management', location: 'In-Office · Karachi, Pakistan', managerId: 'ali-al-musalami' },

  { id: 'hamdan-chitari-mohammad', name: 'Hamdan Chitari Mohammad', title: 'Customer Success Manager', department: 'Management Consulting', location: 'Remote · Bahrain', managerId: 'naseer-ahmed' },
  { id: 'mohamed-el-sabban', name: 'Mohamed El Sabban', title: 'Client Partner, MENA', department: 'Management Consulting', location: 'Remote · Egypt', managerId: 'hamdan-chitari-mohammad' },
  { id: 'tarek-mohamed-hassan-awis', name: 'Tarek Mohamed Hassan Awis', title: 'Senior Customer Success Manager', department: 'Project Management', location: 'Remote · Egypt', managerId: 'hamdan-chitari-mohammad' },
  { id: 'abdulrahman-rahmi', name: 'AbdulRahman Rahmi', title: 'Customer Success Manager', department: 'Management Consulting', location: 'In-Office · Saudi Arabia', managerId: 'hamdan-chitari-mohammad' },

  { id: 'this-role-not-filled', name: 'This role is not filled at the moment', title: '', department: 'Innovation COE', location: '', managerId: 'akber-gardezi' },

  { id: 'zainab-azeem', name: 'Zainab Azeem', title: 'Front End Developer', department: 'Product Development', location: 'In-Office · Islamabad, Pakistan', managerId: 'akber-gardezi' },
  { id: 'muhammad-ishaq', name: 'Muhammad Ishaq', title: 'Backend Developer', department: 'Product Development', location: 'In-Office · Islamabad, Pakistan', managerId: 'zainab-azeem' },
  { id: 'muhammad-khubaib', name: 'Muhammad Khubaib', title: 'Junior AI Engineer', department: 'Data and AI', location: 'In-Office · Islamabad, Pakistan', managerId: 'zainab-azeem' },

  { id: 'muhammad-abid', name: 'Muhammad Abid', title: 'Office Assistant', department: 'Admin', location: 'In-Office · Karachi, Pakistan', managerId: 'akber-gardezi' },
  { id: 'raheel-ahmed', name: 'Raheel Ahmed', title: 'Administration Officer', department: 'Admin', location: 'In-Office · Karachi, Pakistan', managerId: 'muhammad-abid' },
  { id: 'farha-al-anzi', name: 'Farha Al-Anzi', title: 'Administrative Assistant', department: 'Admin', location: 'Remote · Saudi Arabia', managerId: 'muhammad-abid' },
  { id: 'rao-anees', name: 'Rao Anees', title: 'HR Generalist', department: 'Human Resources', location: 'In-Office · Islamabad, Pakistan', managerId: 'muhammad-abid' },

  // ---------- Vitaliy Savranskiy's branch: Systems Engineering (Cloud / Service Desk / SOC / Networking) ----------
  { id: 'nazar-kravchenko', name: 'Nazar Kravchenko', title: 'Head of Cloud Solutions', department: 'Systems Engineering', location: 'Remote · Ukraine', managerId: 'vitaliy-savranskiy' },
  { id: 'paulino-novelo', name: 'Paulino Novelo', title: 'Lead Solutions Architect', department: 'Systems Engineering', location: 'Remote · Mexico', managerId: 'nazar-kravchenko' },
  { id: 'rakeshh-babu-k-v-babu', name: 'Rakeshh Babu K V Babu', title: 'Solutions Architect', department: 'Systems Engineering', location: 'Remote · India', managerId: 'paulino-novelo' },
  { id: 'christopher-cruz', name: 'Christopher Cruz', title: 'Cloud Solutions Architect', department: 'Systems Engineering', location: 'Remote · US, California', managerId: 'paulino-novelo' },
  { id: 'carlos-esparza', name: 'Carlos Esparza', title: 'Senior Solutions Architect', department: 'Systems Engineering', location: 'Remote · US, California', managerId: 'paulino-novelo' },
  { id: 'mubeen-inamdar', name: 'Mubeen Inamdar', title: 'Junior Cloud Solutions Architect', department: 'Systems Engineering', location: 'Remote · India', managerId: 'paulino-novelo' },
  { id: 'sandeep-sharma', name: 'Sandeep Sharma', title: 'Senior AWS Architect', department: 'Systems Engineering', location: 'Remote · India', managerId: 'paulino-novelo' },
  { id: 'mario-vincente-quinto', name: 'Mario Vincente Quinto', title: 'Junior Cloud Solutions Architect', department: 'Systems Engineering', location: 'Remote · Mexico', managerId: 'paulino-novelo' },

  { id: 'hassan-naqvi', name: 'Hassan Naqvi', title: 'Service Desk Manager', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'vitaliy-savranskiy' },
  { id: 'umar-ahmed', name: 'Umar Ahmed', title: 'Junior Service Desk Engineer', department: 'Service Desk', location: 'In-Office · Karachi, Pakistan', managerId: 'hassan-naqvi' },
  { id: 'junaid-hyder', name: 'Junaid Hyder', title: 'Service Desk Engineer', department: 'Service Desk', location: 'In-Office · Karachi, Pakistan', managerId: 'hassan-naqvi' },
  { id: 'ubaid-rehman', name: 'Ubaid Rehman', title: 'Microsoft 365 Administrator', department: 'Systems Engineering', location: 'In-Office · Islamabad, Pakistan', managerId: 'hassan-naqvi' },
  { id: 'ahmed-ullah-syed', name: 'Ahmed Ullah Syed', title: 'Senior Service Desk Engineer', department: 'Service Desk', location: 'Remote · India', managerId: 'hassan-naqvi' },

  { id: 'muhammad-saad', name: 'Muhammad Saad', title: 'Manager, Cloud Engineering', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'vitaliy-savranskiy' },
  { id: 'ryan-sanchez', name: 'Ryan Sanchez', title: 'Team Lead, Cloud Engineering', department: 'Systems Engineering', location: 'Remote · US, Oregon', managerId: 'muhammad-saad' },
  { id: 'owais-shahid', name: 'Owais Shahid', title: 'Azure Cloud Engineer', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'ryan-sanchez' },
  { id: 'afroze-shabbir', name: 'Afroze Shabbir', title: 'Team Lead, Cloud Engineering', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'muhammad-saad' },
  { id: 'syed-maaz-akhtar', name: 'Syed Maaz Akhtar', title: 'Azure Cloud Engineer', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'afroze-shabbir' },
  { id: 'vinod-yerava', name: 'Vinod Yerava', title: 'AWS Cloud Engineer', department: 'Systems Engineering', location: 'Remote · India', managerId: 'afroze-shabbir' },

  { id: 'abdul-azeem-shaikh', name: 'Abdul azeem Shaikh', title: 'Engagement Manager', department: 'Service Desk', location: 'In-Office · Houston, TX', managerId: 'vitaliy-savranskiy' },
  { id: 'sahaj-tara', name: 'Sahaj Tara', title: 'IT Support Engineer', department: 'Service Desk', location: 'In-Office · Houston, TX', managerId: 'abdul-azeem-shaikh' },

  { id: 'ammad-ud-din', name: 'Ammad Ud Din', title: 'SOC Manager', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'vitaliy-savranskiy' },
  { id: 'bilal-ahmed', name: 'Bilal Ahmed', title: 'SOC Analyst', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'ammad-ud-din' },
  { id: 'muhammad-bazil-khan', name: 'Muhammad Bazil Khan', title: 'SOC Engineer', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'ammad-ud-din' },
  { id: 'rana-rehman', name: 'Rana Rehman', title: 'SOC Engineer', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'ammad-ud-din' },

  { id: 'asad-riaz', name: 'Asad Riaz', title: 'NOC Engineer', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'vitaliy-savranskiy' },

  { id: 'aurang-zaib-butt', name: 'Aurang Zaib Butt', title: 'Team Lead, Networking', department: 'Systems Engineering', location: 'In-Office · Pakistan', managerId: 'vitaliy-savranskiy' },
  { id: 'fahad-siddique', name: 'Fahad Siddique', title: 'Service Desk Engineer', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'aurang-zaib-butt' },
  { id: 'mussawar-ahmed', name: 'Mussawar Ahmed', title: 'Network Engineer', department: 'Systems Engineering', location: 'In-Office · Islamabad, Pakistan', managerId: 'aurang-zaib-butt' },
  { id: 'muhammad-ahsan-khan', name: 'Muhammad Ahsan Khan', title: 'Network Engineer', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'aurang-zaib-butt' },
  { id: 'taras-supinskiy', name: 'Taras Supinskiy', title: 'Senior Security Engineer', department: 'Systems Engineering', location: 'Remote · Ukraine', managerId: 'aurang-zaib-butt' },
  { id: 'arbab-tariq', name: 'Arbab Tariq', title: 'Unified Communications Engineer', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'aurang-zaib-butt' },

  { id: 'joise-joy-kallarakkal', name: 'Joise Joy Kallarakkal', title: 'Back End Team Lead', department: 'Software Engineering', location: 'Remote · US, New Jersey', managerId: 'priyank-panchal' },
  { id: 'shahid-babar', name: 'Shahid Babar', title: 'Service Desk Manager', department: 'Systems Engineering', location: 'In-Office · Karachi, Pakistan', managerId: 'vitaliy-savranskiy' },
];

/** Quick lookup by id. */
export function getPerson(id: string): Person | undefined {
  return ORG_PEOPLE.find((p) => p.id === id);
}

/** Direct reports of a given person id. */
export function getDirectReports(id: string): Person[] {
  return ORG_PEOPLE.filter((p) => p.managerId === id);
}

/**
 * Maps the POC's existing department labels (lib/session-seed.ts) to the
 * real department's acting manager in this chart, so the hire's own
 * "You" node can be anchored under a real person. The POC's department
 * *names* stay as-is (content/departments/*.md slugs depend on them) even
 * though the real org uses different names for the same teams — see the
 * comment on each entry for the real-world mapping.
 */
export const DEPARTMENT_MANAGER_ID: Record<string, string> = {
  'Cloud & Infrastructure': 'muhammad-saad', // real dept: Systems Engineering → Cloud Engineering
  'Project Management': 'vladimir-blatin', // real dept: Project Management, under Sales Engineering
  'Sales & Customer Success': 'naseer-ahmed', // real dept: Management Consulting → Customer Success
  'Security Operations': 'ammad-ud-din', // real dept: Systems Engineering → SOC
  'Service Desk': 'hassan-naqvi', // real dept: Systems Engineering → Service Desk
  'Creative & Multimedia': 'zakie-zabar', // real dept: Innovation COE → Design
};
