const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Seeding Spiritual Outreach CRM Chandkheda database...');

  // 1. Clean existing data
  await prisma.sessionAttendance.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.courseSession.deleteMany();
  await prisma.courseBatch.deleteMany();
  await prisma.course.deleteMany();
  await prisma.programParticipation.deleteMany();
  await prisma.program.deleteMany();
  await prisma.japaLog.deleteMany();
  await prisma.yatraParticipation.deleteMany();
  await prisma.whatsAppLog.deleteMany();
  await prisma.whatsAppTemplate.deleteMany();
  await prisma.followupTask.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.callingTask.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.person.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemOption.deleteMany();
  await prisma.customField.deleteMany();

  // 2. Create Users / Volunteers with Authenticated Passwords
  const admin = await prisma.user.create({
    data: {
      name: 'Akshay Aanand Prabhu',
      username: 'admin',
      email: 'admin@chandkheda.org',
      passwordHash: hashPassword('Admin@123'),
      phone: '+91 98250 11001',
      role: 'SUPER_ADMIN',
      avatar: null,
    }
  });

  const coordinator = await prisma.user.create({
    data: {
      name: 'Govinda Priya Devi',
      username: 'coordinator',
      email: 'coordinator@chandkheda.org',
      passwordHash: hashPassword('Coord@123'),
      phone: '+91 98250 11002',
      role: 'COORDINATOR',
      avatar: 'GPD',
    }
  });

  const volunteerAmit = await prisma.user.create({
    data: {
      name: 'Amit Kumar',
      username: 'amit',
      email: 'amit.sewa@chandkheda.org',
      passwordHash: hashPassword('Amit@123'),
      phone: '+91 98250 12345',
      role: 'CALLING_VOLUNTEER',
      avatar: 'AK',
    }
  });

  const volunteerPriya = await prisma.user.create({
    data: {
      name: 'Priya Devi',
      username: 'priya',
      email: 'priya.sewa@chandkheda.org',
      passwordHash: hashPassword('Priya@123'),
      phone: '+91 98250 54321',
      role: 'RELATIONSHIP_VOLUNTEER',
      avatar: 'PD',
    }
  });

  const volunteerRahul = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      username: 'rahul',
      email: 'rahul.v@chandkheda.org',
      passwordHash: hashPassword('Rahul@123'),
      phone: '+91 98250 99887',
      role: 'CALLING_VOLUNTEER',
      avatar: 'RV',
    }
  });

  // 3. Create System Options
  const systemOptions = [
    { category: 'STAGE', label: 'New Person', value: 'New Person', color: '#6B7280', sortOrder: 1 },
    { category: 'STAGE', label: 'Contacted', value: 'Contacted', color: '#3B82F6', sortOrder: 2 },
    { category: 'STAGE', label: 'Interested', value: 'Interested', color: '#8B5CF6', sortOrder: 3 },
    { category: 'STAGE', label: 'Invited', value: 'Invited', color: '#F59E0B', sortOrder: 4 },
    { category: 'STAGE', label: 'Confirmed', value: 'Confirmed', color: '#10B981', sortOrder: 5 },
    { category: 'STAGE', label: 'Attended', value: 'Attended', color: '#059669', sortOrder: 6 },
    { category: 'STAGE', label: 'Relationship Follow-up', value: 'Relationship Follow-up', color: '#D9480F', sortOrder: 7 },
    { category: 'STAGE', label: 'Connected', value: 'Connected', color: '#00A896', sortOrder: 8 },

    { category: 'SOURCE', label: 'Friend / Reference', value: 'Friend / Reference', sortOrder: 1 },
    { category: 'SOURCE', label: 'Society Outreach', value: 'Society Outreach', sortOrder: 2 },
    { category: 'SOURCE', label: 'Book Distribution', value: 'Book Distribution', sortOrder: 3 },
    { category: 'SOURCE', label: 'Program Stall', value: 'Program Stall', sortOrder: 4 },
    { category: 'SOURCE', label: 'Instagram / YouTube', value: 'Instagram / YouTube', sortOrder: 5 },
    { category: 'SOURCE', label: 'Website Form', value: 'Website Form', sortOrder: 6 },

    { category: 'CALL_OUTCOME', label: 'Connected', value: 'CONNECTED', color: '#10B981', sortOrder: 1 },
    { category: 'CALL_OUTCOME', label: 'No Answer', value: 'NO_ANSWER', color: '#F59E0B', sortOrder: 2 },
    { category: 'CALL_OUTCOME', label: 'Call Back', value: 'CALL_BACK', color: '#3B82F6', sortOrder: 3 },
    { category: 'CALL_OUTCOME', label: 'Interested', value: 'INTERESTED', color: '#8B5CF6', sortOrder: 4 },
    { category: 'CALL_OUTCOME', label: 'Yes, Will Attend', value: 'YES_WILL_ATTEND', color: '#059669', sortOrder: 5 },
    { category: 'CALL_OUTCOME', label: 'Maybe', value: 'MAYBE', color: '#D97706', sortOrder: 6 },
    { category: 'CALL_OUTCOME', label: 'Not Interested', value: 'NOT_INTERESTED', color: '#EF4444', sortOrder: 7 },
    { category: 'CALL_OUTCOME', label: 'Wrong Number', value: 'WRONG_NUMBER', color: '#9CA3AF', sortOrder: 8 },
    { category: 'CALL_OUTCOME', label: 'Do Not Contact', value: 'DO_NOT_CONTACT', color: '#DC2626', sortOrder: 9 },
  ];

  for (const opt of systemOptions) {
    await prisma.systemOption.create({ data: opt });
  }

  // 4. Create WhatsApp Templates
  const templates = [
    {
      name: 'Bhagavad Gita Intro Seminar — RSVP Invite',
      category: 'PROGRAM_INVITE',
      bodyText: `Hare Krishna {{name}} Ji! 🙏

We warmly invite you & your family to the upcoming *{{program_name}}* at ISKCON Chandkheda Center.

🗓 *Date:* {{date}}
⏰ *Time:* {{time}}
📍 *Venue:* {{venue}}
🎁 *Includes:* Vedic Discourse, Q&A, and Grand Prasadam Feast.

Kindly confirm your attendance by replying *YES* to this message.

Yours in Seva,
*{{coordinator_name}}* ({{coordinator_phone}})`,
      variablesList: JSON.stringify(['name', 'program_name', 'date', 'time', 'venue', 'coordinator_name', 'coordinator_phone']),
    },
    {
      name: 'Gita Shiksha Course — Session Reminder',
      category: 'COURSE_REMINDER',
      bodyText: `Hare Krishna {{name}} Ji! 🌸

Gentle reminder for *{{course_name}}* (Session {{session_no}}).

🗓 *Date:* {{date}}
⏰ *Time:* {{time}}
📍 *Venue:* {{venue}}
📖 *Topic:* {{topic}}

Please bring your notebook & Gita. We look forward to having you with us!

Sewa Coordinator,
*{{coordinator_name}}*`,
      variablesList: JSON.stringify(['name', 'course_name', 'session_no', 'date', 'time', 'venue', 'topic', 'coordinator_name']),
    },
    {
      name: 'Absent Student Check-in & Video Link',
      category: 'ABSENTEE_FOLLOWUP',
      bodyText: `Hare Krishna {{name}} Ji! 🙏

We missed you at yesterday's *{{course_name}}* (Session {{session_no}}). We hope all is well with you and your family.

🎥 *Session Summary & Recording Link:*
{{recording_link}}

Next session is on *{{next_session_date}}*. Feel free to message if you have any questions!

Warm regards,
*{{coordinator_name}}*`,
      variablesList: JSON.stringify(['name', 'course_name', 'session_no', 'recording_link', 'next_session_date', 'coordinator_name']),
    },
    {
      name: 'Janmashtami Mahotsav Grand Invitation',
      category: 'FESTIVAL_GREETING',
      bodyText: `Jai Sri Krishna {{name}} Ji! 🪷

You & your family are cordially invited to the auspicious *Sri Krishna Janmashtami Mahotsav 2026* at Chandkheda Center.

🗓 *Date:* {{date}}
🌟 *Highlights:* 24hr Akhand Kirtan, Abhishek, Drama, 108 Bhoga Offering & Mid-night Aarti followed by Feast Prasadam.

We pray for Lord Krishna's blessings upon your family. Please grace the occasion!

Devotees at ISKCON Chandkheda`,
      variablesList: JSON.stringify(['name', 'date']),
    },
    {
      name: 'First-Time Visitor Thank You & Sunday Feast',
      category: 'RELATIONSHIP',
      bodyText: `Hare Krishna {{name}} Ji! 🙏

Thank you for visiting ISKCON Chandkheda Center. It was wonderful connecting with you.

We would love to welcome you to our weekly *Sunday Youth & Family Satsang* every Sunday at 5:00 PM with insightful spiritual discourse, soulful kirtan, and sanctified Prasadam.

Feel free to stay in touch!

In Sri Krishna's Seva,
*{{coordinator_name}}*`,
      variablesList: JSON.stringify(['name', 'coordinator_name']),
    }
  ];

  for (const tpl of templates) {
    await prisma.whatsAppTemplate.create({ data: tpl });
  }

  // 5. Create People (Master Contacts)
  const peopleData = [
    {
      fullName: 'Rahul Patel',
      mobile: '9876543210',
      whatsappNumber: '9876543210',
      email: 'rahul.patel@example.com',
      area: 'Chandkheda, Sector 4',
      ageGroup: '26-35',
      profession: 'Software Architect',
      source: 'Book Distribution',
      stage: 'Relationship Follow-up',
      assignedVolunteerId: volunteerAmit.id,
      relationshipVolunteerId: volunteerPriya.id,
      tags: 'Youth, Gita Student, Regular, Japa 4 Rounds',
      notes: 'Very receptive to Bhagavad Gita philosophy. Reads daily. Family also interested.',
      address: 'B-402, Shivalik Heights, Sector 4, Chandkheda, Ahmedabad',
      firstVisitDate: new Date('2026-01-12'),
      japaDailyRounds: 4,
      spiritualMentor: 'HG Damodar Das',
    },
    {
      fullName: 'Meena Patel',
      mobile: '9876543211',
      whatsappNumber: '9876543211',
      email: 'meena.patel@example.com',
      area: 'Motera',
      ageGroup: '36-50',
      profession: 'Educator / Teacher',
      source: 'Program Stall',
      stage: 'Confirmed',
      assignedVolunteerId: volunteerPriya.id,
      relationshipVolunteerId: volunteerPriya.id,
      tags: 'Life Patron, Sunday Regular, Prasadam Seva',
      notes: 'Confirmed attending Gita Program with family (3 pax). Expressed interest in cooking seva.',
      address: 'A-12, Sundarvan Society, Motera, Ahmedabad',
      firstVisitDate: new Date('2025-11-20'),
      japaDailyRounds: 8,
      spiritualMentor: 'HG Radheshyam Das',
    },
    {
      fullName: 'Rajesh Sharma',
      mobile: '9876543212',
      whatsappNumber: '9876543212',
      email: 'rajesh.sharma@example.com',
      area: 'Chandkheda West',
      ageGroup: '36-50',
      profession: 'Business Owner',
      source: 'Friend / Reference',
      stage: 'Contacted',
      assignedVolunteerId: volunteerAmit.id,
      relationshipVolunteerId: volunteerAmit.id,
      tags: 'Business, Course Batch 1',
      notes: 'Missed Session 4 due to business travel. Needs follow-up before Session 5.',
      address: '104, Royal Arcade, Chandkheda West',
      firstVisitDate: new Date('2026-02-15'),
      japaDailyRounds: 2,
    },
    {
      fullName: 'Sonal Mehta',
      mobile: '9876543213',
      whatsappNumber: '9876543213',
      email: 'sonal.mehta@example.com',
      area: 'Chandkheda',
      ageGroup: '26-35',
      profession: 'Doctor (Dentist)',
      source: 'Society Outreach',
      stage: 'Attended',
      assignedVolunteerId: volunteerRahul.id,
      relationshipVolunteerId: volunteerPriya.id,
      tags: 'Medical Camp Volunteer, Gita Student',
      notes: 'Attended Gita intro seminar. Very enthusiastic. Volunteered for health checkup camp.',
      address: 'C-301, Titanium City, New C.G. Road, Chandkheda',
      firstVisitDate: new Date('2026-03-01'),
      japaDailyRounds: 4,
    },
    {
      fullName: 'Hiren Joshi',
      mobile: '9876543214',
      whatsappNumber: '9876543214',
      email: 'hiren.joshi@example.com',
      area: 'Sabarmati',
      ageGroup: '50+',
      profession: 'Retired Govt Officer',
      source: 'Book Distribution',
      stage: 'Relationship Follow-up',
      assignedVolunteerId: volunteerAmit.id,
      relationshipVolunteerId: volunteerPriya.id,
      tags: 'Senior Devotee, Japa 16 Rounds',
      notes: 'Chanting 16 rounds steadily. Very pious devotee.',
      address: '45, Shanti Kunj, Sabarmati, Ahmedabad',
      firstVisitDate: new Date('2025-08-15'),
      japaDailyRounds: 16,
      spiritualMentor: 'HG Damodar Das',
    },
    {
      fullName: 'Vikram Trivedi',
      mobile: '9876543215',
      whatsappNumber: '9876543215',
      email: 'vikram.t@example.com',
      area: 'Nigam Nagar',
      ageGroup: 'Youth (18-25)',
      profession: 'Engineering Student',
      source: 'Instagram / YouTube',
      stage: 'New Person',
      assignedVolunteerId: volunteerPriya.id,
      relationshipVolunteerId: volunteerPriya.id,
      tags: 'Youth, College, First Time',
      notes: 'Registered online via Instagram youth seminar post. First call scheduled.',
      address: 'Hostel Block B, VGEC Campus, Chandkheda',
      firstVisitDate: new Date('2026-09-10'),
      japaDailyRounds: 1,
    }
  ];

  const createdPeople = [];
  for (const p of peopleData) {
    const person = await prisma.person.create({ data: p });
    createdPeople.push(person);

    // Initial timeline event
    await prisma.timelineEvent.create({
      data: {
        personId: person.id,
        eventType: 'NOTE',
        title: 'Devotee Contact Created',
        description: `Added via ${person.source} under stage '${person.stage}'`,
        createdByUserId: admin.id,
      }
    });
  }

  const rahul = createdPeople[0];
  const meena = createdPeople[1];
  const rajesh = createdPeople[2];
  const sonal = createdPeople[3];
  const hiren = createdPeople[4];
  const vikram = createdPeople[5];

  // 6. Create Programs
  const gitaProgram = await prisma.program.create({
    data: {
      title: 'Bhagavad Gita Introduction Seminar',
      programType: 'Bhagavad Gita Intro',
      eventDate: new Date('2026-09-28T17:00:00Z'),
      eventTime: '5:00 PM – 7:30 PM',
      venue: 'Main Satsang Hall, Chandkheda Center',
      description: 'Introductory seminar on practical spiritual life from Gita by HG Radheshyam Das.',
      coordinatorId: coordinator.id,
      capacity: 500,
      status: 'UPCOMING',
    }
  });

  const janmashtamiFestival = await prisma.program.create({
    data: {
      title: 'Grand Janmashtami Mahotsav 2026',
      programType: 'Janmashtami Festival',
      eventDate: new Date('2026-08-15T18:00:00Z'),
      eventTime: '6:00 PM – 12:30 AM',
      venue: 'Main Temple Courtyard & Hall',
      description: 'Grand celebration with Kalash Abhisheka, Drama, 108 Bhoga & Maha Aarti.',
      coordinatorId: coordinator.id,
      capacity: 1200,
      status: 'COMPLETED',
    }
  });

  // Program Participations
  await prisma.programParticipation.create({
    data: {
      programId: gitaProgram.id,
      personId: rahul.id,
      invitationStatus: 'CONFIRMED',
      attendanceStatus: 'UNKNOWN',
      reminderDone: true,
      guestsCount: 2,
      notes: 'Confirmed attending with spouse.',
    }
  });

  await prisma.programParticipation.create({
    data: {
      programId: gitaProgram.id,
      personId: meena.id,
      invitationStatus: 'CONFIRMED',
      attendanceStatus: 'UNKNOWN',
      reminderDone: true,
      guestsCount: 3,
      notes: 'Confirmed attending with family.',
    }
  });

  await prisma.programParticipation.create({
    data: {
      programId: janmashtamiFestival.id,
      personId: rahul.id,
      invitationStatus: 'CONFIRMED',
      attendanceStatus: 'ATTENDED',
      reminderDone: true,
      guestsCount: 3,
      notes: 'Attended full festival.',
    }
  });

  await prisma.programParticipation.create({
    data: {
      programId: janmashtamiFestival.id,
      personId: sonal.id,
      invitationStatus: 'CONFIRMED',
      attendanceStatus: 'ATTENDED',
      reminderDone: true,
      guestsCount: 2,
    }
  });

  // 7. Create Courses & Multi-Session Batches
  const gitaCourse = await prisma.course.create({
    data: {
      title: 'Gita Shiksha Course — Batch 1',
      courseType: 'Foundations of Bhagavad Gita',
      startDate: new Date('2026-08-30'),
      facultyName: 'HG Radheshyam Das',
      venue: 'Main Hall, Chandkheda Center',
      status: 'ACTIVE',
      totalSessions: 10,
      description: 'A 10-week systematic study of Bhagavad Gita covering Karma Yoga, Dhyana Yoga, and Bhakti Yoga.',
      coordinatorId: coordinator.id,
    }
  });

  const batch1 = await prisma.courseBatch.create({
    data: {
      courseId: gitaCourse.id,
      batchName: 'Batch 1 (Saturday Evening)',
      startDate: new Date('2026-08-30'),
      scheduleInfo: 'Every Saturday 6:30 PM',
      active: true,
    }
  });

  // Create 5 Sessions
  const s1 = await prisma.courseSession.create({
    data: {
      batchId: batch1.id,
      sessionNumber: 1,
      title: 'Session 1: Discovering Your Inner Identity',
      sessionDate: new Date('2026-08-30T18:30:00Z'),
      topicSummary: 'Introduction to Atma vs Body (Chapter 2 overview)',
      completed: true,
    }
  });

  const s2 = await prisma.courseSession.create({
    data: {
      batchId: batch1.id,
      sessionNumber: 2,
      title: 'Session 2: Art of Mind Control & Peace',
      sessionDate: new Date('2026-09-06T18:30:00Z'),
      topicSummary: 'Mind as friend and enemy (Chapter 6 overview)',
      completed: true,
    }
  });

  const s3 = await prisma.courseSession.create({
    data: {
      batchId: batch1.id,
      sessionNumber: 3,
      title: 'Session 3: Science of Karma & Reincarnation',
      sessionDate: new Date('2026-09-13T18:30:00Z'),
      topicSummary: 'Law of action and reaction, liberation path',
      completed: true,
    }
  });

  const s4 = await prisma.courseSession.create({
    data: {
      batchId: batch1.id,
      sessionNumber: 4,
      title: 'Session 4: Three Modes of Material Nature',
      sessionDate: new Date('2026-09-20T18:30:00Z'),
      topicSummary: 'Sattva, Rajas, Tamas and their influence on lifestyle',
      completed: true,
    }
  });

  const s5 = await prisma.courseSession.create({
    data: {
      batchId: batch1.id,
      sessionNumber: 5,
      title: 'Session 5: Supreme Goal of Human Life (Bhakti)',
      sessionDate: new Date('2026-09-27T18:30:00Z'),
      topicSummary: 'Bhakti Yoga essence and practical chanting',
      completed: false,
    }
  });

  // Course Enrollments
  const rahulEnrollment = await prisma.courseEnrollment.create({
    data: {
      courseId: gitaCourse.id,
      batchId: batch1.id,
      personId: rahul.id,
      status: 'REGULAR',
      attendancePercent: 75.0,
      receiptNumber: 'REC-9821',
      notes: 'Very attentive student.',
    }
  });

  const rajeshEnrollment = await prisma.courseEnrollment.create({
    data: {
      courseId: gitaCourse.id,
      batchId: batch1.id,
      personId: rajesh.id,
      status: 'IRREGULAR',
      attendancePercent: 50.0,
      receiptNumber: 'REC-9825',
      notes: 'Travels often.',
    }
  });

  const sonalEnrollment = await prisma.courseEnrollment.create({
    data: {
      courseId: gitaCourse.id,
      batchId: batch1.id,
      personId: sonal.id,
      status: 'REGULAR',
      attendancePercent: 100.0,
      receiptNumber: 'REC-9830',
      notes: '100% attendance so far.',
    }
  });

  // Session Attendance Records
  // Rahul: S1 (Present), S2 (Present), S3 (Present), S4 (Absent)
  await prisma.sessionAttendance.create({
    data: { sessionId: s1.id, enrollmentId: rahulEnrollment.id, personId: rahul.id, status: 'PRESENT', quizScore: 10, recordedByUserId: coordinator.id }
  });
  await prisma.sessionAttendance.create({
    data: { sessionId: s2.id, enrollmentId: rahulEnrollment.id, personId: rahul.id, status: 'PRESENT', quizScore: 9, recordedByUserId: coordinator.id }
  });
  await prisma.sessionAttendance.create({
    data: { sessionId: s3.id, enrollmentId: rahulEnrollment.id, personId: rahul.id, status: 'PRESENT', quizScore: 10, recordedByUserId: coordinator.id }
  });
  await prisma.sessionAttendance.create({
    data: { sessionId: s4.id, enrollmentId: rahulEnrollment.id, personId: rahul.id, status: 'ABSENT', notes: 'Traveling for office work', recordedByUserId: coordinator.id }
  });

  // Sonal: S1-S4 Present
  for (const sess of [s1, s2, s3, s4]) {
    await prisma.sessionAttendance.create({
      data: { sessionId: sess.id, enrollmentId: sonalEnrollment.id, personId: sonal.id, status: 'PRESENT', quizScore: 10, recordedByUserId: coordinator.id }
    });
  }

  // Rajesh: S1, S2 Present, S3, S4 Absent
  await prisma.sessionAttendance.create({
    data: { sessionId: s1.id, enrollmentId: rajeshEnrollment.id, personId: rajesh.id, status: 'PRESENT', quizScore: 8, recordedByUserId: coordinator.id }
  });
  await prisma.sessionAttendance.create({
    data: { sessionId: s2.id, enrollmentId: rajeshEnrollment.id, personId: rajesh.id, status: 'PRESENT', quizScore: 7, recordedByUserId: coordinator.id }
  });
  await prisma.sessionAttendance.create({
    data: { sessionId: s3.id, enrollmentId: rajeshEnrollment.id, personId: rajesh.id, status: 'ABSENT', notes: 'Health issue', recordedByUserId: coordinator.id }
  });
  await prisma.sessionAttendance.create({
    data: { sessionId: s4.id, enrollmentId: rajeshEnrollment.id, personId: rajesh.id, status: 'ABSENT', notes: 'Out of town', recordedByUserId: coordinator.id }
  });

  // 8. Create Calling Task and Call Logs
  const task1 = await prisma.callingTask.create({
    data: {
      title: "Today's Calling Sewa: Gita Intro RSVPs & Session 4 Absentee Follow-ups",
      campaignType: 'PROGRAM',
      targetId: gitaProgram.id,
      volunteerId: volunteerAmit.id,
      status: 'IN_PROGRESS',
      deadline: new Date('2026-09-22T20:00:00Z'),
      notes: 'Priority calls for Chandkheda & Motera devotees.',
    }
  });

  // Call Logs
  await prisma.callLog.create({
    data: {
      personId: rahul.id,
      volunteerId: volunteerAmit.id,
      taskId: task1.id,
      callType: 'Absent Student Follow-up',
      outcome: 'CONNECTED',
      notes: 'Spoke with Rahul Ji regarding missed Session 4. He was traveling for office work and will catch up via recording. Confirmed attending Session 5.',
      followUpDate: new Date('2026-09-28'),
      followUpPriority: 'HIGH',
    }
  });

  await prisma.callLog.create({
    data: {
      personId: meena.id,
      volunteerId: volunteerPriya.id,
      callType: 'Program Invitation',
      outcome: 'YES_WILL_ATTEND',
      notes: 'Invited Meena Ji for upcoming Gita Seminar. Confirmed attending with 3 family members.',
      followUpDate: new Date('2026-09-27'),
      followUpPriority: 'MEDIUM',
    }
  });

  await prisma.callLog.create({
    data: {
      personId: hiren.id,
      volunteerId: volunteerAmit.id,
      callType: 'Relationship Call',
      outcome: 'CONNECTED',
      notes: 'Routine 30-day spiritual well-being call. Chanting 16 rounds steadily. Very pleased.',
      followUpDate: new Date('2026-10-20'),
      followUpPriority: 'LOW',
    }
  });

  // Follow-up Tasks
  await prisma.followupTask.create({
    data: {
      personId: rahul.id,
      volunteerId: volunteerAmit.id,
      type: 'Calling',
      status: 'PENDING',
      dueDate: new Date('2026-09-28'),
      priority: 'HIGH',
      remarks: 'Pre-session 5 reminder call to ensure attendance.',
    }
  });

  await prisma.followupTask.create({
    data: {
      personId: rajesh.id,
      volunteerId: volunteerAmit.id,
      type: 'Calling',
      status: 'PENDING',
      dueDate: new Date('2026-09-22'),
      priority: 'URGENT',
      remarks: 'Absent in Sessions 3 & 4. Needs personal relationship check-in.',
    }
  });

  await prisma.followupTask.create({
    data: {
      personId: vikram.id,
      volunteerId: volunteerPriya.id,
      type: 'Calling',
      status: 'PENDING',
      dueDate: new Date('2026-09-22'),
      priority: 'MEDIUM',
      remarks: 'Welcome call for new online registration.',
    }
  });

  // 9. Japa Logs
  await prisma.japaLog.create({
    data: { personId: rahul.id, rounds: 4, remarks: 'Morning chanting before office', recordedByUserId: volunteerAmit.id }
  });
  await prisma.japaLog.create({
    data: { personId: meena.id, rounds: 8, remarks: 'Early morning Brahma Muhurta chanting', recordedByUserId: volunteerPriya.id }
  });
  await prisma.japaLog.create({
    data: { personId: hiren.id, rounds: 16, remarks: 'Completed 16 rounds by 10 AM', recordedByUserId: volunteerAmit.id }
  });

  // 10. Rich 360 Timeline for Rahul Patel
  const rahulEvents = [
    { title: 'Absentee Calling Logged', description: 'Amit Kumar logged call: "Was traveling for office work, will attend session 5 without fail."', eventType: 'CALL', createdAt: new Date('2026-09-21T19:15:00Z') },
    { title: 'WhatsApp Template Sent', description: 'Template: Gita Shiksha Session 4 Reminder delivered via Click-to-Chat', eventType: 'WHATSAPP', createdAt: new Date('2026-09-18T10:30:00Z') },
    { title: 'Session 3 Attended (Gita Shiksha Course)', description: 'Marked Present by Sewa Desk. Quiz Score: 10/10.', eventType: 'COURSE_SESSION', createdAt: new Date('2026-09-13T18:30:00Z') },
    { title: 'Relationship Call Completed', description: 'Priya Devi called: "Inquired about family health, very inspired by Chapter 2 shlokas."', eventType: 'CALL', createdAt: new Date('2026-09-10T16:12:00Z') },
    { title: 'Enrolled in Gita Shiksha Course (Batch 1)', description: 'Receipt #REC-9821 issued. Course kit & Japa Mala distributed.', eventType: 'COURSE_ENROLL', createdAt: new Date('2026-08-28T11:00:00Z') },
    { title: 'Program Attended: Janmashtami Mahotsav', description: 'Attended grand festival with family (3 attendees).', eventType: 'PROGRAM_ATTEND', createdAt: new Date('2026-08-15T18:00:00Z') },
    { title: 'First Contact Logged', description: 'Met at Book Distribution stall at Chandkheda Circle. Expressed keen interest in Gita.', eventType: 'NOTE', createdAt: new Date('2026-08-02T17:00:00Z') },
  ];

  for (const ev of rahulEvents) {
    await prisma.timelineEvent.create({
      data: {
        personId: rahul.id,
        eventType: ev.eventType,
        title: ev.title,
        description: ev.description,
        createdByUserId: volunteerAmit.id,
        createdAt: ev.createdAt,
      }
    });
  }

  console.log('✅ Database seeded successfully with Morpankh & Temple Gold Chandkheda CRM data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
