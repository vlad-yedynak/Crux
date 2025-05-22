using Crux.Extensions;
using Crux.Models.Cards;
using Crux.Models.EntityTypes;
using Crux.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Crux.Data;

public class ApplicationDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }

    public DbSet<Lesson> Lessons { get; set; }

    public DbSet<Card> Cards { get; set; }
    
    public DbSet<EducationalCard> EducationalCards { get; set; }
    
    public DbSet<TestCard> TestCards { get; set; }
    
    public DbSet<Question> Questions { get; set; }
    
    public DbSet<Answer> Answers { get; set; }
    
    public DbSet<SandboxCard> SandboxCards { get; set; }
    
    public DbSet<Models.Entities.Task> Tasks { get; set; }
    
    public DbSet<TaskData> TaskData { get; set; }
    
    public DbSet<UserTaskProgress> UserTaskProgresses { get; set; }
    
    public DbSet<UserQuestionProgress> UserQuestionProgresses { get; set; }
    
    public DbSet<UserLessonProgress> UserLessonProgresses { get; set; }
    
    public DbSet<CardAttachment> CardAttachments { get; set; }
    
    public DbSet<CardImage> CardImages { get; set; }
    
    public DbSet<LessonTracker> LessonTrackers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity
                .Property(e => e.FirstName)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .Property(e => e.LastName)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .Property(e => e.Email)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .HasIndex(e => e.Email)
                .IsUnique();
            
            entity
                .Property(e => e.Password)
                .HasMaxLength(255)
                .IsRequired();

            entity
                .Property(e => e.Role)
                .HasConversion(e => e.ToString(), e => e.ToUserRole())
                .IsRequired();
        });

        modelBuilder.Entity<Lesson>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity
                .Property(e => e.Title)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .HasMany(e => e.Cards)
                .WithOne(e => e.Lesson)
                .HasForeignKey(e => e.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Card>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity
                .Property(e => e.Title)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .Property(e => e.LessonId)
                .IsRequired();
            
            entity
                .Property(e => e.Description)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .Property(e => e.CardType)
                .HasConversion(e => e.ToString(), e => e.ToCardType())
                .IsRequired();

            entity
                .HasDiscriminator<CardType>("CardType")
                .HasValue<EducationalCard>(CardType.Educational)
                .HasValue<TestCard>(CardType.Test)
                .HasValue<SandboxCard>(CardType.Sandbox);
        });

        modelBuilder.Entity<EducationalCard>(entity =>
        {
            entity
                .Property(e => e.Content)
                .HasColumnType("Text")
                .IsRequired();

            entity
                .HasMany(e => e.Images)
                .WithOne(i => i.EducationalCard)
                .HasForeignKey(i => i.EducationalCardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasMany(e => e.Attachments)
                .WithOne(a => a.EducationalCard)
                .HasForeignKey(a => a.EducationalCardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CardImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity
                .Property(e => e.Url)
                .IsRequired();
            
            entity
                .Property(e => e.Caption)
                .HasMaxLength(255);
            
            entity
                .Property(e => e.AltText)
                .HasMaxLength(255);
        });

        modelBuilder.Entity<CardAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity
                .Property(e => e.Url)
                .IsRequired();

            entity
                .Property(e => e.Description)
                .HasMaxLength(255)
                .IsRequired();
        });
        
        modelBuilder.Entity<TestCard>(entity =>
        {
            entity
                .HasMany(e => e.Questions)
                .WithOne(e => e.TestCard)
                .HasForeignKey(e => e.TestCardId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<SandboxCard>(entity =>
        {
            entity
                .Property(e => e.Type)
                .IsRequired();

            entity
                .Property(e => e.Type)
                .HasConversion(e => e.ToString(), e => e.ToSandboxCardType())
                .IsRequired();
        });
        
        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity
                .Property(e => e.TestCardId)
                .IsRequired();

            entity
                .Property(e => e.QuestionText)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .HasMany(e => e.Answers)
                .WithOne(e => e.Question)
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Answer>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity
                .Property(e => e.QuestionId)
                .IsRequired();

            entity
                .Property(e => e.AnswerText)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .Property(e => e.Score)
                .IsRequired();

            entity
                .Property(e => e.IsCorrect)
                .IsRequired();
        });

        modelBuilder.Entity<Models.Entities.Task>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity
                .Property(e => e.Name)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .Property(e => e.Description)
                .HasMaxLength(255)
                .IsRequired();
            
            entity
                .Property(e => e.Points)
                .IsRequired();

            entity
                .HasMany(e => e.ExpectedData)
                .WithOne(e => e.Task)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TaskData>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Ignore(e => e.Value);

            entity.Property(e => e.ValueInt);
            
            entity.Property(e => e.ValueDouble);
            
            entity.Property(e => e.ValueString);
            
            entity.Property(e => e.ValueBool);
        });

        modelBuilder.Entity<UserTaskProgress>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.TaskId });
            
            entity
                .HasOne<User>()
                .WithMany(e => e.CompletedTasks)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<UserQuestionProgress>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.QuestionId });
            
            entity
                .HasOne<User>()
                .WithMany(e => e.CompletedQuestions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<UserLessonProgress>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LessonId });

            entity
                .HasOne(e => e.User)
                .WithMany(u => u.ScorePoints)
                .HasForeignKey(e => e.UserId);

            entity
                .HasOne(e => e.Lesson)
                .WithMany(l => l.UserScorePoints)
                .HasForeignKey(e => e.LessonId);

            entity.Property(e => e.ScorePoint).IsRequired();
        });
        
        modelBuilder.Entity<LessonTracker>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LessonId });

            entity
                .HasOne(e => e.User)
                .WithMany(u => u.LessonTrackers)
                .HasForeignKey(e => e.UserId);

            entity
                .HasOne(e => e.Lesson)
                .WithMany(l => l.LessonTrackers)
                .HasForeignKey(e => e.LessonId);

            entity.Property(e => e.TrackedTime).IsRequired();
        });
    }
}
