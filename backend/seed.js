const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Staff = require('./models/Staff');
const Category = require('./models/Category');
const Book = require('./models/Book');
const Issue = require('./models/Issue');
const Fine = require('./models/Fine');
const Payment = require('./models/Payment');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_management_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Staff.deleteMany();
    await Category.deleteMany();
    await Book.deleteMany();
    await Issue.deleteMany();
    await Fine.deleteMany();
    await Payment.deleteMany();
    console.log('🧹 Purged existing collections.');

    // 1. Seed Users
    const adminUser = await User.create({
      name: 'Library Admin',
      email: 'admin@library.com',
      password: 'Admin@123',
      phone: '+91 99999 00001',
      role: 'admin',
      address: 'Central University Administrative Block, Room 102'
    });

    const staffUser = await User.create({
      name: 'Library Staff',
      email: 'staff@library.com',
      password: 'Staff@123',
      phone: '+91 99999 00002',
      role: 'staff',
      address: 'Central Library Circulation Desk'
    });

    const studentUser = await User.create({
      name: 'Demo Student',
      email: 'student@library.com',
      password: 'Student@123',
      phone: '+91 98765 43210',
      role: 'user',
      address: 'Hostel Block 4, Room 218'
    });

    const studentRahul = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@college.edu',
      password: 'Student@123',
      phone: '+91 98765 12345',
      role: 'user',
      address: 'Hostel Block 2, Room 105'
    });

    const studentPriya = await User.create({
      name: 'Priya Patel',
      email: 'priya@college.edu',
      password: 'Student@123',
      phone: '+91 98765 67890',
      role: 'user',
      address: 'Hostel Block 1, Room 302'
    });

    // 2. Seed Staff Profile
    await Staff.create({
      user: staffUser._id,
      employeeId: 'EMP-1001',
      department: 'Circulation & Reference',
      designation: 'Assistant Librarian',
      isActive: true
    });
    console.log('👤 Seeded Admin, Staff, and Students.');

    // 3. Seed Categories
    const categoriesData = [
      { name: 'Programming', description: 'Software development, syntax, and coding paradigms' },
      { name: 'Database', description: 'Relational, NoSQL, and data storage architectures' },
      { name: 'Computer Science', description: 'Theoretical computing, algorithms, and complexity' },
      { name: 'Networking', description: 'Telecommunications, routing, TCP/IP, and cyber security' },
      { name: 'Artificial Intelligence', description: 'Machine learning, deep neural networks, and NLP' },
      { name: 'Operating Systems', description: 'Kernel architecture, memory management, and concurrency' },
      { name: 'Mathematics', description: 'Discrete math, calculus, linear algebra, and probability' },
      { name: 'Literature', description: 'Classic fiction, humanities, and world literature' },
      { name: 'Management', description: 'Entrepreneurship, leadership, and organization strategy' }
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const created = await Category.create(cat);
      categoryMap[cat.name] = created._id;
    }
    console.log('📚 Seeded 9 Categories.');

    // 4. Seed Books
    const booksData = [
      {
        bookId: 'BK-1001',
        title: 'Data Structures and Algorithms in Java',
        author: 'Robert Lafore',
        isbn: '978-0672324536',
        category: categoryMap['Computer Science'],
        publisher: 'Sams Publishing',
        publicationYear: 2002,
        description: 'Comprehensive introduction to algorithms and essential data structures including arrays, trees, heaps, graphs, and hash tables with clean explanations.',
        shelfLocation: 'Stack CS-101',
        totalCopies: 5,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1002',
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        category: categoryMap['Programming'],
        publisher: 'Prentice Hall',
        publicationYear: 2008,
        description: 'Even bad code can function. But if code is not clean, it can bring a development organization to its knees. Master writing readable, maintainable software.',
        shelfLocation: 'Stack PR-204',
        totalCopies: 4,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1003',
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz, Henry F. Korth',
        isbn: '978-0073523323',
        category: categoryMap['Database'],
        publisher: 'McGraw-Hill Education',
        publicationYear: 2019,
        description: 'The definitive text for university database systems courses covering relational model, SQL transactions, concurrency control, and distributed databases.',
        shelfLocation: 'Stack DB-302',
        totalCopies: 6,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1004',
        title: 'Computer Networking: A Top-Down Approach',
        author: 'James Kurose, Keith Ross',
        isbn: '978-0133594140',
        category: categoryMap['Networking'],
        publisher: 'Pearson',
        publicationYear: 2020,
        description: 'Renowned top-down pedagogy focusing on application-layer paradigms down through the transport, network, and link layer protocols of the Internet.',
        shelfLocation: 'Stack NET-401',
        totalCopies: 3,
        availableCopies: 2,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1005',
        title: 'Artificial Intelligence: A Modern Approach',
        author: 'Stuart Russell, Peter Norvig',
        isbn: '978-0134610993',
        category: categoryMap['Artificial Intelligence'],
        publisher: 'Pearson',
        publicationYear: 2020,
        description: 'The standard global AI textbook introducing search algorithms, probabilistic reasoning, reinforcement learning, NLP, and neural networks.',
        shelfLocation: 'Stack AI-505',
        totalCopies: 4,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1507842229451-79b1be8d5a2f?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1006',
        title: 'Operating System Concepts',
        author: 'Abraham Silberschatz, Peter B. Galvin',
        isbn: '978-1118063330',
        category: categoryMap['Operating Systems'],
        publisher: 'Wiley',
        publicationYear: 2018,
        description: 'Widely known as the Dinosaur Book, covering processes, threads, virtual memory, synchronization, CPU scheduling, storage, and distributed systems.',
        shelfLocation: 'Stack OS-108',
        totalCopies: 4,
        availableCopies: 0,
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
        status: 'Currently Unavailable'
      },
      {
        bookId: 'BK-1007',
        title: 'Discrete Mathematics and Its Applications',
        author: 'Kenneth H. Rosen',
        isbn: '978-1259676512',
        category: categoryMap['Mathematics'],
        publisher: 'McGraw-Hill',
        publicationYear: 2018,
        description: 'Fundamental mathematical foundations for computer scientists: logic, set theory, combinatorics, graph theory, induction, and relations.',
        shelfLocation: 'Stack MATH-201',
        totalCopies: 5,
        availableCopies: 5,
        image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1008',
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        isbn: '978-1449373320',
        category: categoryMap['Database'],
        publisher: "O'Reilly Media",
        publicationYear: 2017,
        description: 'Deep dive into data systems: replication, partitioning, transactions, consensus algorithms, stream processing, and batch architectures.',
        shelfLocation: 'Stack DB-305',
        totalCopies: 4,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1009',
        title: 'The Pragmatic Programmer: Your Journey to Mastery',
        author: 'David Thomas, Andrew Hunt',
        isbn: '978-0135957059',
        category: categoryMap['Programming'],
        publisher: 'Addison-Wesley Professional',
        publicationYear: 2019,
        description: 'Classic insights on programming craft, tooling, communication, architecture, and engineering discipline for modern developers.',
        shelfLocation: 'Stack PR-209',
        totalCopies: 3,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1010',
        title: 'The Lean Startup',
        author: 'Eric Ries',
        isbn: '978-0307887894',
        category: categoryMap['Management'],
        publisher: 'Crown Business',
        publicationYear: 2011,
        description: 'How modern entrepreneurs use continuous innovation and build-measure-learn feedback loops to create radically successful businesses.',
        shelfLocation: 'Stack MGMT-101',
        totalCopies: 4,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1011',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0061120084',
        category: categoryMap['Literature'],
        publisher: 'Harper Perennial',
        publicationYear: 2006,
        description: 'Pulitzer Prize-winning masterpiece exploring justice, empathy, race, and morality in the American South through the eyes of young Scout Finch.',
        shelfLocation: 'Stack LIT-014',
        totalCopies: 3,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1012',
        title: 'Introduction to Algorithms (CLRS)',
        author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
        isbn: '978-0262033848',
        category: categoryMap['Computer Science'],
        publisher: 'MIT Press',
        publicationYear: 2009,
        description: 'The world-famous algorithmic Bible covering sorting, dynamic programming, greedy algorithms, graph algorithms, and NP-completeness.',
        shelfLocation: 'Stack CS-105',
        totalCopies: 6,
        availableCopies: 5,
        image: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1013',
        title: 'Effective Java',
        author: 'Joshua Bloch',
        isbn: '978-0134685991',
        category: categoryMap['Programming'],
        publisher: 'Addison-Wesley Professional',
        publicationYear: 2018,
        description: 'The definitive guide to Java best practices covering generics, enums, annotations, lambdas, streams, and concurrency patterns.',
        shelfLocation: 'Stack PR-215',
        totalCopies: 5,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1014',
        title: 'Refactoring: Improving the Design of Existing Code',
        author: 'Martin Fowler',
        isbn: '978-0134757599',
        category: categoryMap['Programming'],
        publisher: 'Addison-Wesley Professional',
        publicationYear: 2018,
        description: 'Essential techniques to disassemble and reconstruct legacy code safely with automated tests, code smells detection, and catalog of refactorings.',
        shelfLocation: 'Stack PR-218',
        totalCopies: 4,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1015',
        title: 'Cracking the Coding Interview',
        author: 'Gayle Laakmann McDowell',
        isbn: '978-0984782857',
        category: categoryMap['Programming'],
        publisher: 'CareerCup',
        publicationYear: 2015,
        description: '189 programming questions and solutions covering Big-O analysis, system design, technical interview strategies, algorithms, and data structures.',
        shelfLocation: 'Stack PR-225',
        totalCopies: 7,
        availableCopies: 6,
        image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1016',
        title: 'The Art of Computer Programming (Vol 1: Fundamental Algorithms)',
        author: 'Donald E. Knuth',
        isbn: '978-0201896831',
        category: categoryMap['Computer Science'],
        publisher: 'Addison-Wesley',
        publicationYear: 1997,
        description: 'The landmark magnum opus of computer science covering information structures, representation of elements, linear lists, trees, and multilinked structures.',
        shelfLocation: 'Stack CS-110',
        totalCopies: 3,
        availableCopies: 2,
        image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1017',
        title: 'Deep Learning',
        author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
        isbn: '978-0262035613',
        category: categoryMap['Artificial Intelligence'],
        publisher: 'MIT Press',
        publicationYear: 2016,
        description: 'Foundational textbook on deep neural networks, mathematical basics, optimization algorithms, convolutional networks, sequence modeling, and generative models.',
        shelfLocation: 'Stack AI-512',
        totalCopies: 5,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1018',
        title: 'Pattern Recognition and Machine Learning',
        author: 'Christopher M. Bishop',
        isbn: '978-0387310732',
        category: categoryMap['Artificial Intelligence'],
        publisher: 'Springer',
        publicationYear: 2006,
        description: 'Comprehensive introduction to statistical pattern recognition, Bayesian inference, graphical models, kernel methods, and mixture models.',
        shelfLocation: 'Stack AI-518',
        totalCopies: 4,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1507842229451-79b1be8d5a2f?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1019',
        title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
        author: 'Aurélien Géron',
        isbn: '978-1098125974',
        category: categoryMap['Artificial Intelligence'],
        publisher: "O'Reilly Media",
        publicationYear: 2022,
        description: 'Practical guide to building intelligent end-to-end ML pipelines using concrete examples, minimal theory, and production-ready Python frameworks.',
        shelfLocation: 'Stack AI-520',
        totalCopies: 5,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1020',
        title: 'High-Performance Browser Networking',
        author: 'Ilya Grigorik',
        isbn: '978-1449344764',
        category: categoryMap['Networking'],
        publisher: "O'Reilly Media",
        publicationYear: 2013,
        description: 'What every web developer should know about TCP, UDP, TLS, HTTP/2, WebSockets, and WebRTC to build ultra-fast low-latency networked applications.',
        shelfLocation: 'Stack NET-412',
        totalCopies: 4,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1021',
        title: 'TCP/IP Illustrated (Volume 1: The Protocols)',
        author: 'W. Richard Stevens, Kevin R. Fall',
        isbn: '978-0321336316',
        category: categoryMap['Networking'],
        publisher: 'Addison-Wesley Professional',
        publicationYear: 2011,
        description: 'The undisputed masterwork on Internet protocol suite engineering, packet captures, routing, TCP flow control, and congestion mitigation.',
        shelfLocation: 'Stack NET-418',
        totalCopies: 3,
        availableCopies: 2,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1022',
        title: 'Database Internals: Distributed Data Systems',
        author: 'Alex Petrov',
        isbn: '978-1492040347',
        category: categoryMap['Database'],
        publisher: "O'Reilly Media",
        publicationYear: 2019,
        description: 'An in-depth guide on how B-Trees, LSM-Trees, storage engines, distributed consensus algorithms (Paxos & Raft), and replication work under the hood.',
        shelfLocation: 'Stack DB-310',
        totalCopies: 4,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1023',
        title: 'Operating Systems: Three Easy Pieces',
        author: 'Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau',
        isbn: '978-1985086593',
        category: categoryMap['Operating Systems'],
        publisher: 'CreateSpace',
        publicationYear: 2018,
        description: 'A brilliantly clear presentation of core OS fundamentals structured around Virtualization, Concurrency, and Persistence.',
        shelfLocation: 'Stack OS-115',
        totalCopies: 4,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1024',
        title: 'Modern Operating Systems',
        author: 'Andrew S. Tanenbaum, Herbert Bos',
        isbn: '978-0133591620',
        category: categoryMap['Operating Systems'],
        publisher: 'Pearson',
        publicationYear: 2014,
        description: 'In-depth coverage of contemporary operating systems including Windows, Linux, Android, virtualization, hypervisors, and security architectures.',
        shelfLocation: 'Stack OS-122',
        totalCopies: 5,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1025',
        title: 'Linear Algebra and Its Applications',
        author: 'Gilbert Strang',
        isbn: '978-0030105678',
        category: categoryMap['Mathematics'],
        publisher: 'Cengage Learning',
        publicationYear: 2006,
        description: 'Renowned MIT professor Gilbert Strang explains matrix transformations, vector spaces, eigenvalues, eigenvectors, and singular value decomposition.',
        shelfLocation: 'Stack MATH-208',
        totalCopies: 5,
        availableCopies: 5,
        image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1026',
        title: 'Calculus: Early Transcendentals',
        author: 'James Stewart',
        isbn: '978-1285741550',
        category: categoryMap['Mathematics'],
        publisher: 'Cengage Learning',
        publicationYear: 2015,
        description: 'The world standard calculus curriculum text renowned for mathematical precision, clear explanations, and real-world engineering problem sets.',
        shelfLocation: 'Stack MATH-215',
        totalCopies: 4,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1027',
        title: 'Zero to One: Notes on Startups',
        author: 'Peter Thiel, Blake Masters',
        isbn: '978-0804139298',
        category: categoryMap['Management'],
        publisher: 'Crown Business',
        publicationYear: 2014,
        description: 'Legendary Silicon Valley investor Peter Thiel shares how building truly new technologies creates valuable enduring business monopolies.',
        shelfLocation: 'Stack MGMT-108',
        totalCopies: 4,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1028',
        title: 'Good to Great',
        author: 'Jim Collins',
        isbn: '978-0066620992',
        category: categoryMap['Management'],
        publisher: 'HarperBusiness',
        publicationYear: 2001,
        description: 'Decades of empirical corporate research uncovering how companies transition from mediocrity to sustained Level 5 leadership greatness.',
        shelfLocation: 'Stack MGMT-115',
        totalCopies: 4,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1029',
        title: 'The DevOps Handbook',
        author: 'Gene Kim, Jez Humble, Patrick Debois, John Willis',
        isbn: '978-1942788003',
        category: categoryMap['Management'],
        publisher: 'IT Revolution Press',
        publicationYear: 2016,
        description: 'How to create world-class agility, reliability, and security in technology organizations with continuous integration, deployment, and telemetry.',
        shelfLocation: 'Stack MGMT-122',
        totalCopies: 3,
        availableCopies: 3,
        image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1030',
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0451524935',
        category: categoryMap['Literature'],
        publisher: 'Signet Classic',
        publicationYear: 1950,
        description: 'Dystopian classic exposing totalitarianism, state surveillance, historical distortion, and thought police through Winston Smith struggle.',
        shelfLocation: 'Stack LIT-022',
        totalCopies: 5,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1031',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0743273565',
        category: categoryMap['Literature'],
        publisher: 'Scribner',
        publicationYear: 2004,
        description: 'The definitive portrait of the Jazz Age exploring ambition, obsession, unattainable love, and the disillusionment of the American Dream.',
        shelfLocation: 'Stack LIT-028',
        totalCopies: 4,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1032',
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '978-0553380163',
        category: categoryMap['Computer Science'],
        publisher: 'Bantam Books',
        publicationYear: 1998,
        description: 'Stephen Hawking explores the deepest questions of cosmology: the Big Bang, black holes, light cones, and the ultimate quest for a theory of everything.',
        shelfLocation: 'Stack CS-125',
        totalCopies: 4,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      },
      {
        bookId: 'BK-1033',
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        isbn: '978-0465050659',
        category: categoryMap['Programming'],
        publisher: 'Basic Books',
        publicationYear: 2013,
        description: 'The quintessential handbook on cognitive ergonomics, user affordances, feedback loops, and human-centered design for modern digital products.',
        shelfLocation: 'Stack PR-230',
        totalCopies: 4,
        availableCopies: 4,
        image: 'https://images.unsplash.com/photo-1507842229451-79b1be8d5a2f?auto=format&fit=crop&q=80&w=600',
        status: 'Available'
      }
    ];

    const createdBooks = await Book.insertMany(booksData);
    console.log(`📖 Seeded ${createdBooks.length} Books.`);

    // 5. Seed Sample Issues, Fines, and Payments
    const now = new Date();
    const dsaBook = createdBooks.find(b => b.bookId === 'BK-1001');
    const cleanCodeBook = createdBooks.find(b => b.bookId === 'BK-1002');
    const dbBook = createdBooks.find(b => b.bookId === 'BK-1003');
    const osBook = createdBooks.find(b => b.bookId === 'BK-1006');

    // Issue 1: Pending request by Demo Student
    await Issue.create({
      user: studentUser._id,
      book: cleanCodeBook._id,
      requestedBy: studentUser._id,
      status: 'pending',
      remarks: 'Requested for semester project'
    });

    // Issue 2: Active issue to Demo Student (Due in 7 days)
    const activeIssueDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const activeDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await Issue.create({
      user: studentUser._id,
      book: dsaBook._id,
      requestedBy: studentUser._id,
      approvedBy: staffUser._id,
      issuedBy: staffUser._id,
      issueDate: activeIssueDate,
      dueDate: activeDueDate,
      status: 'issued'
    });

    // Issue 2B: Demo Student fine (₹20 pending fine ready to pay with PhonePe QR)
    const studentPastIssue = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000);
    const studentPastDue = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    const studentReturnLate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const studentOverdueIssue = await Issue.create({
      user: studentUser._id,
      book: cleanCodeBook._id,
      requestedBy: studentUser._id,
      approvedBy: staffUser._id,
      issuedBy: staffUser._id,
      issueDate: studentPastIssue,
      dueDate: studentPastDue,
      returnDate: studentReturnLate,
      status: 'returned'
    });
    await Fine.create({
      user: studentUser._id,
      book: cleanCodeBook._id,
      issue: studentOverdueIssue._id,
      dueDate: studentPastDue,
      returnDate: studentReturnLate,
      lateDays: 2,
      fineRate: 10,
      totalFine: 20,
      paymentStatus: 'pending'
    });

    // Issue 3: Returned 3 days late by Rahul Sharma -> Generated fine of ₹30 (Pending payment)
    const pastIssueDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const pastDueDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const returnDate3DaysLate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const overdueIssue = await Issue.create({
      user: studentRahul._id,
      book: dbBook._id,
      requestedBy: studentRahul._id,
      approvedBy: staffUser._id,
      issuedBy: staffUser._id,
      issueDate: pastIssueDate,
      dueDate: pastDueDate,
      returnDate: returnDate3DaysLate,
      status: 'returned'
    });

    const pendingFine = await Fine.create({
      user: studentRahul._id,
      book: dbBook._id,
      issue: overdueIssue._id,
      dueDate: pastDueDate,
      returnDate: returnDate3DaysLate,
      lateDays: 3,
      fineRate: 10,
      totalFine: 30,
      paymentStatus: 'pending'
    });

    // Issue 4: Returned 5 days late by Priya Patel -> Generated fine of ₹50 -> Already PAID with transaction ID
    const priyaIssueDate = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
    const priyaDueDate = new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000);
    const priyaReturnDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    const paidIssue = await Issue.create({
      user: studentPriya._id,
      book: osBook._id,
      requestedBy: studentPriya._id,
      approvedBy: staffUser._id,
      issuedBy: staffUser._id,
      issueDate: priyaIssueDate,
      dueDate: priyaDueDate,
      returnDate: priyaReturnDate,
      status: 'returned'
    });

    const paidFine = await Fine.create({
      user: studentPriya._id,
      book: osBook._id,
      issue: paidIssue._id,
      dueDate: priyaDueDate,
      returnDate: priyaReturnDate,
      lateDays: 5,
      fineRate: 10,
      totalFine: 50,
      paymentStatus: 'paid'
    });

    await Payment.create({
      user: studentPriya._id,
      fine: paidFine._id,
      amount: 50,
      paymentMethod: 'UPI',
      transactionId: 'UTR-425619028471',
      utrNumber: '425619028471',
      upiId: 'priya@okhdfcbank',
      payeeName: 'SOURABH AGRAWAL',
      payeeUpi: '9302732410@axl',
      paymentStatus: 'success',
      paymentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    });

    console.log('💳 Seeded sample issues, fine records, and demo payment transactions.');
    console.log('\n==========================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('Demo Credentials:');
    console.log('👑 Admin:   admin@library.com   / Admin@123');
    console.log('📋 Staff:   staff@library.com   / Staff@123');
    console.log('🎓 Student: student@library.com / Student@123');
    console.log('==========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
