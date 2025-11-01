// Email Service - SendGrid Integration
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email templates
const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Laipni lūdzam DeyaRun! 🏃‍♂️',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏃‍♂️ DeyaRun</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tavs personīgais skrējienu treneris</p>
        </div>
        
        <h2 style="color: #FF6B35;">Sveiki, ${data.firstName}!</h2>
        
        <p>Apsveicam ar pievienošanos DeyaRun platformai! Mēs esam sajūsmā, ka pievienojaties mūsu skrējēju kopienai.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #FF6B35; margin-top: 0;">Ko varat darīt tagad:</h3>
          <ul style="color: #333;">
            <li>📱 Ielādēt mobilo aplikāciju GPS izsekošanai</li>
            <li>🎯 Izveidot savu personīgo treniņu plānu</li>
            <li>📊 Sekot līdzi progresam un sasniegumiem</li>
            <li>👥 Pievienoties skrējēju kopienai</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://deyarun.com/dashboard" 
             style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Sākt treniņus →
          </a>
        </div>
        
        <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          Ja jums ir jautājumi, atbildiet uz šo e-pastu vai sazinieties ar mums.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Ar cieņu,<br>
          <strong>DeyaRun komanda</strong>
        </p>
      </div>
    `
  },

  passwordReset: {
    subject: 'DeyaRun - Paroles atjaunošana 🔒',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Paroles atjaunošana</h1>
        </div>
        
        <h2 style="color: #FF6B35;">Sveiki, ${data.firstName}!</h2>
        
        <p>Mēs saņēmām pieprasījumu atjaunot jūsu DeyaRun konta paroli.</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>Svarīgi:</strong> Šī saite būs derīga tikai 1 stundu pēc nosūtīšanas.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetLink}" 
             style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Atjaunot paroli
          </a>
        </div>
        
        <p>Ja jūs nepieprasījāt paroles maiņu, ignorējiet šo e-pastu. Jūsu parole paliks nemainīga.</p>
        
        <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          Ar cieņu,<br>
          <strong>DeyaRun komanda</strong>
        </p>
      </div>
    `
  },

  emailVerification: {
    subject: 'Apstiprināt e-pasta adresi - DeyaRun ✉️',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✉️ Apstiprināt e-pastu</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">DeyaRun konts</p>
        </div>
        
        <h2 style="color: #FF6B35;">Sveiki, ${data.firstName}!</h2>
        
        <p>Paldies par reģistrēšanos DeyaRun platformā! Lai pabeigtu konta izveidi, lūdzu apstiprināt savu e-pasta adresi.</p>
        
        <div style="background: #e8f4fd; border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0c5460;">
            <strong>Kāpēc jāapstiprina e-pasts?</strong><br>
            Tas palīdz mums pārliecināties, ka varam sazināties ar jums par svarīgiem kontu jautājumiem un treniņu atjauninājumiem.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationLink}" 
             style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Apstiprināt e-pasta adresi
          </a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>Svarīgi:</strong> Šī saite būs derīga 24 stundas. Ja neapstiprināt e-pastu, konts var tikt dzēsts.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Ja nevarēsiet noklikšķināt uz pogas, kopējiet un ielīmējiet šo saiti savā pārlūkprogrammā:<br>
          <a href="${data.verificationLink}" style="color: #FF6B35; word-break: break-all;">${data.verificationLink}</a>
        </p>
        
        <p>Ja jūs nereģistrējāties DeyaRun, ignorējiet šo e-pastu.</p>
        
        <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          Ar cieņu,<br>
          <strong>DeyaRun komanda</strong>
        </p>
      </div>
    `
  },

  workoutSummary: {
    subject: 'Treniņa kopsavilkums - ${workoutDate} 💪',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💪 Treniņa kopsavilkums</h1>
        </div>
        
        <h2 style="color: #FF6B35;">Lieliski, ${data.firstName}!</h2>
        
        <p>Jūs nupat pabeidzāt treniņu. Lielisks darbs!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #FF6B35; margin-top: 0;">Treniņa statistika:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <strong>Attālums:</strong> ${data.distance} km<br>
              <strong>Laiks:</strong> ${data.duration}<br>
              <strong>Temps:</strong> ${data.pace} min/km
            </div>
            <div>
              <strong>Dedzinātas kalorijas:</strong> ${data.calories}<br>
              <strong>Sirdsdarbība:</strong> ${data.avgHeartRate} bpm<br>
              <strong>Paaugstinājums:</strong> ${data.elevation} m
            </div>
          </div>
        </div>
        
        ${data.achievements && data.achievements.length > 0 ? `
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">🏆 Jauni sasniegumi!</h3>
          <ul style="color: #155724;">
            ${data.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://deyarun.com/workouts/${data.workoutId}" 
             style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Skatīt detalizēti →
          </a>
        </div>
        
        <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          Ar cieņu,<br>
          <strong>DeyaRun komanda</strong>
        </p>
      </div>
    `
  },

  weeklyReport: {
    subject: 'Nedēļas progress ziņojums - DeyaRun 📊',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📊 Nedēļas ziņojums</h1>
          <p style="color: white; margin: 10px 0 0 0;">${data.weekStart} - ${data.weekEnd}</p>
        </div>
        
        <h2 style="color: #FF6B35;">Sveiki, ${data.firstName}!</h2>
        
        <p>Šeit ir jūsu nedēļas aktivitāšu kopsavilkums:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #FF6B35; margin-top: 0;">Nedēļas statistika:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <strong>Treniņi:</strong> ${data.workoutCount}<br>
              <strong>Kopējais attālums:</strong> ${data.totalDistance} km<br>
              <strong>Kopējais laiks:</strong> ${data.totalTime}
            </div>
            <div>
              <strong>Vidējais temps:</strong> ${data.avgPace} min/km<br>
              <strong>Kalorijas:</strong> ${data.totalCalories}<br>
              <strong>Mērķis sasniegts:</strong> ${data.goalAchieved ? '✅' : '❌'}
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://deyarun.com/analytics" 
             style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Skatīt analītiku →
          </a>
        </div>
        
        <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          Ar cieņu,<br>
          <strong>DeyaRun komanda</strong>
        </p>
      </div>
    `
  },

  bugReportNotification: {
    subject: '🐛 Jauns kļūdas ziņojums - DeyaRun',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🐛 Jauns kļūdas ziņojums</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">DeyaRun Admin Panel</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #e74c3c; margin-top: 0;">${data.title}</h2>
          <p style="color: #666; margin: 5px 0;"><strong>Kategorija:</strong> ${data.categoryLabel}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Prioritāte:</strong> <span style="color: ${data.priorityColor};">${data.priority}</span></p>
          <p style="color: #666; margin: 5px 0;"><strong>Datums:</strong> ${data.createdAt}</p>
        </div>
        
        <div style="background: white; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">Apraksts:</h3>
          <p style="color: #555; line-height: 1.6;">${data.description}</p>
        </div>
        
        ${data.userInfo ? `
          <div style="background: #e8f5e8; border-left: 4px solid #27ae60; padding: 15px; margin-bottom: 20px;">
            <h4 style="color: #27ae60; margin-top: 0;">Lietotāja informācija:</h4>
            <p style="color: #555; margin: 5px 0;"><strong>Vārds:</strong> ${data.userInfo.name || 'Nav norādīts'}</p>
            <p style="color: #555; margin: 5px 0;"><strong>E-pasts:</strong> ${data.userInfo.email || 'Nav norādīts'}</p>
            ${data.userInfo.userId ? `<p style="color: #555; margin: 5px 0;"><strong>Lietotāja ID:</strong> ${data.userInfo.userId}</p>` : ''}
          </div>
        ` : `
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
            <p style="color: #856404; margin: 0;"><strong>Anonīms ziņojums</strong> - lietotājs nav pieslēgts</p>
          </div>
        `}
        
        ${data.deviceInfo ? `
          <div style="background: #f0f8ff; border-left: 4px solid #007bff; padding: 15px; margin-bottom: 20px;">
            <h4 style="color: #007bff; margin-top: 0;">Ierīces informācija:</h4>
            <p style="color: #555; margin: 5px 0;"><strong>Platforma:</strong> ${data.deviceInfo.platform || 'Nav norādīta'}</p>
            <p style="color: #555; margin: 5px 0;"><strong>OS versija:</strong> ${data.deviceInfo.osVersion || 'Nav norādīta'}</p>
            <p style="color: #555; margin: 5px 0;"><strong>App versija:</strong> ${data.deviceInfo.appVersion || 'Nav norādīta'}</p>
            ${data.deviceInfo.deviceModel ? `<p style="color: #555; margin: 5px 0;"><strong>Ierīce:</strong> ${data.deviceInfo.deviceModel}</p>` : ''}
          </div>
        ` : ''}
        
        ${data.stepsToReproduce ? `
          <div style="background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin-top: 0;">Reproducēšanas soļi:</h4>
            <p style="color: #555; line-height: 1.6;">${data.stepsToReproduce.replace(/\\n/g, '<br>')}</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.adminUrl}" 
             style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
            Skatīt admin panelī →
          </a>
        </div>
        
        <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            <strong>Ziņojuma ID:</strong> ${data.reportId}<br>
            <strong>IP adrese:</strong> ${data.ipAddress || 'Nav pieejama'}<br>
            <strong>Laiks:</strong> ${data.timestamp}
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
          Šis ir automātisks paziņojums no DeyaRun sistēmas.<br>
          <strong>Nelietojiet "Atbildēt" - šis e-pasts nav monitorēts.</strong>
        </p>
      </div>
    `
  }
};

class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'run@coredigify.com';
    this.fromName = process.env.FROM_NAME || 'DeyaRun';
    this.isEnabled = !!process.env.SENDGRID_API_KEY;
    
    if (!this.isEnabled) {
      console.warn('⚠️ SendGrid API key not configured - emails will be simulated');
    } else {
      console.log('✅ SendGrid email service initialized');
    }
  }

  /**
   * Send email using SendGrid
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlContent - HTML email content
   * @param {string} textContent - Plain text content (optional)
   */
  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      if (!this.isEnabled) {
        console.log('📧 Email simulation:', { to, subject });
        return { success: true, messageId: 'simulated-' + Date.now() };
      }

      const msg = {
        to: to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent)
      };

      const [response] = await sgMail.send(msg);
      
      console.log('✅ Email sent successfully:', {
        to: to,
        subject: subject,
        messageId: response.headers['x-message-id']
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'],
        statusCode: response.statusCode
      };

    } catch (error) {
      console.error('❌ Failed to send email:', {
        to: to,
        subject: subject,
        error: error.message,
        code: error.code
      });

      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail, userData) {
    const template = EMAIL_TEMPLATES.welcome;
    const htmlContent = template.template(userData);
    
    return await this.sendEmail(
      userEmail,
      template.subject,
      htmlContent
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail, userData) {
    const template = EMAIL_TEMPLATES.passwordReset;
    const htmlContent = template.template(userData);
    
    return await this.sendEmail(
      userEmail,
      template.subject,
      htmlContent
    );
  }

  /**
   * Send email verification email
   */
  async sendEmailVerificationEmail(userEmail, userData) {
    const template = EMAIL_TEMPLATES.emailVerification;
    const htmlContent = template.template(userData);
    
    return await this.sendEmail(
      userEmail,
      template.subject,
      htmlContent
    );
  }

  /**
   * Send workout summary email
   */
  async sendWorkoutSummaryEmail(userEmail, workoutData) {
    const template = EMAIL_TEMPLATES.workoutSummary;
    const subject = template.subject.replace('${workoutDate}', workoutData.date);
    const htmlContent = template.template(workoutData);
    
    return await this.sendEmail(
      userEmail,
      subject,
      htmlContent
    );
  }

  /**
   * Send bug report notification to admin
   */
  async sendBugReportNotification(bugReport) {
    try {
      // Admin e-pasts (vajag konfigurēt env failā)
      const adminEmails = process.env.ADMIN_EMAIL ? 
        process.env.ADMIN_EMAIL.split(',').map(email => email.trim()) : 
        ['admin@coredigify.com']; // Fallback

      // Kategoriju labels
      const categoryLabels = {
        'crash': 'Aplikācijas kļūda',
        'performance': 'Veiktspējas problēma',
        'ui_bug': 'Dizaina kļūda',
        'login_issue': 'Pieslēgšanās problēma',
        'gps_tracking': 'GPS problēma',
        'sync_issue': 'Sinhronizācijas problēma',
        'feature_request': 'Funkcionalitātes pieprasījums',
        'other': 'Cits'
      };

      // Prioritāšu krāsas
      const priorityColors = {
        'low': '#28a745',
        'medium': '#ffc107',
        'high': '#fd7e14',
        'critical': '#dc3545'
      };

      // Sagatavot datus template
      const templateData = {
        title: bugReport.title,
        description: bugReport.description,
        categoryLabel: categoryLabels[bugReport.category] || bugReport.category,
        priority: bugReport.priority.toUpperCase(),
        priorityColor: priorityColors[bugReport.priority] || '#6c757d',
        createdAt: new Date(bugReport.createdAt).toLocaleString('lv-LV'),
        reportId: bugReport._id,
        ipAddress: bugReport.ipAddress,
        timestamp: new Date().toLocaleString('lv-LV'),
        
        // Lietotāja informācija
        userInfo: bugReport.userId || bugReport.userEmail ? {
          name: bugReport.userName,
          email: bugReport.userEmail,
          userId: bugReport.userId
        } : null,
        
        // Ierīces informācija
        deviceInfo: bugReport.deviceInfo || null,
        
        // Papildus informācija
        stepsToReproduce: bugReport.stepsToReproduce || null,
        
        // Admin panel URL
        adminUrl: `https://deyarun.com/admin/bug-reports/${bugReport._id}`
      };

      const template = EMAIL_TEMPLATES.bugReportNotification;
      const htmlContent = template.template(templateData);

      // Nosūtām e-pastu visiem admin
      const emailPromises = adminEmails.map(adminEmail => 
        this.sendEmail(
          adminEmail,
          template.subject,
          htmlContent
        )
      );

      const results = await Promise.allSettled(emailPromises);
      
      // Pārbaudam rezultātus
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

      console.log(`📧 Bug report notification sent to ${successful.length}/${adminEmails.length} admins`);
      
      if (failed.length > 0) {
        console.warn(`⚠️ Failed to send to ${failed.length} admins:`, failed);
      }

      return {
        success: successful.length > 0,
        sent: successful.length,
        failed: failed.length,
        adminEmails: adminEmails
      };

    } catch (error) {
      console.error('❌ Error sending bug report notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send weekly progress report
   */
  async sendWeeklyReportEmail(userEmail, reportData) {
    const template = EMAIL_TEMPLATES.weeklyReport;
    const htmlContent = template.template(reportData);
    
    return await this.sendEmail(
      userEmail,
      template.subject,
      htmlContent
    );
  }

  /**
   * Send custom email with template
   */
  async sendCustomEmail(userEmail, subject, templateData, templateName = 'custom') {
    if (EMAIL_TEMPLATES[templateName]) {
      const template = EMAIL_TEMPLATES[templateName];
      const htmlContent = template.template(templateData);
      const finalSubject = template.subject.includes('${') ? 
        this.replaceVariables(template.subject, templateData) : 
        subject || template.subject;
      
      return await this.sendEmail(userEmail, finalSubject, htmlContent);
    }
    
    throw new Error(`Template '${templateName}' not found`);
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  async sendBulkEmails(emails, subject, htmlContent, textContent = null) {
    const results = [];
    const batchSize = 100; // SendGrid recommendation
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => 
        this.sendEmail(email, subject, htmlContent, textContent)
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Rate limiting - wait between batches
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('❌ Bulk email batch failed:', error);
        results.push(...batch.map(() => ({ success: false, error: error.message })));
      }
    }
    
    return results;
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(testEmail = null) {
    const recipient = testEmail || process.env.FROM_EMAIL;
    
    try {
      const result = await this.sendEmail(
        recipient,
        'DeyaRun - Email konfigurācijas tests',
        `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #FF6B35;">✅ Email konfigurācija darbojas!</h2>
          <p>Šis ir testa e-pasts, lai pārbaudītu SendGrid konfigurāciju.</p>
          <p><strong>Sūtīts:</strong> ${new Date().toLocaleString('lv-LV')}</p>
          <p><strong>No:</strong> ${this.fromEmail}</p>
        </div>
        `,
        'Email konfigurācijas tests - DeyaRun'
      );
      
      return result;
    } catch (error) {
      throw new Error(`Email configuration test failed: ${error.message}`);
    }
  }

  /**
   * Get email sending statistics
   */
  async getEmailStats() {
    // This would require SendGrid's Event Webhook or Stats API
    // For now, return basic info
    return {
      isConfigured: this.isEnabled,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      templatesAvailable: Object.keys(EMAIL_TEMPLATES)
    };
  }

  /**
   * Utility: Strip HTML tags for plain text version
   */
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Utility: Replace variables in templates
   */
  replaceVariables(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    }
    return result;
  }
}

// Export singleton instance
export default new EmailService();