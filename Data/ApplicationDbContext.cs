using Crux.Extensions;
using Crux.Models;
using Crux.Models.Cards;
using Microsoft.EntityFrameworkCore;

namespace Crux.Data;

public class ApplicationDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }

    public DbSet<Lesson> Lessons { get; set; }

    public DbSet<Card> Cards { get; set; }
    
    public DbSet<EducationalCard> EducationalCards { get; set; }
    
    public DbSet<TestCard> TestCards { get; set; }
    
    public DbSet<SandboxCard> SandboxCards { get; set; }
    
    public DbSet<Question> Questions { get; set; }
    
    public DbSet<Answer> Answers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.FirstName)
                .HasMaxLength(255)
                .IsRequired();
            
            entity.Property(e => e.LastName)
                .HasMaxLength(255)
                .IsRequired();
            
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .IsRequired();
            
            entity.HasIndex(e => e.Email)
                .IsUnique();
            
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .IsRequired();
            
            entity.Property(e => e.ScorePoints)
                .IsRequired();

            entity.Property(e => e.Role)
                .HasConversion(e => e.ToString(), e => e.ToUserRole())
                .IsRequired();
        });

        modelBuilder.Entity<Lesson>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .IsRequired();
            
            entity.HasMany(e => e.Cards)
                .WithOne(e => e.Lesson)
                .HasForeignKey(e => e.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Card>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .IsRequired();
            
            entity.Property(e => e.LessonId)
                .IsRequired();
            
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .IsRequired();

            entity.HasDiscriminator<CardType>("CardType")
                .HasValue<EducationalCard>(CardType.Educational)
                .HasValue<TestCard>(CardType.Test)
                .HasValue<SandboxCard>(CardType.Sandbox);
        });

        modelBuilder.Entity<EducationalCard>(entity =>
        {
            entity.Property(e => e.Content)
                .HasColumnType("Text")
                .IsRequired();
        });
        
        modelBuilder.Entity<TestCard>(entity =>
        {
            entity.HasMany(e => e.Questions)
                .WithOne(e => e.TestCard)
                .HasForeignKey(e => e.TestCardId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.TestCardId)
                .IsRequired();

            entity.Property(e => e.QuestionText)
                .HasMaxLength(255)
                .IsRequired();
            
            entity.HasMany(e => e.Answers)
                .WithOne(e => e.Question)
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Answer>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.QuestionId)
                .IsRequired();

            entity.Property(e => e.AnswerText)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.IsCorrect)
                .IsRequired();
        });
    }
}
