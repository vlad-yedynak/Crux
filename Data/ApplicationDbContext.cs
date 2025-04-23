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
            
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .IsRequired();

            entity.ToTable("Cards")
                .HasDiscriminator<CardType>("CardType")
                .HasValue<EducationalCard>(CardType.Educational)
                .HasValue<TestCard>(CardType.Test);
        });

        modelBuilder.Entity<EducationalCard>(entity =>
        {
            entity.Property(e => e.Content)
                .HasMaxLength(1023)
                .IsRequired();
        });

        modelBuilder.Entity<TestCard>(entity =>
        {
            entity.Property(e => e.Question)
                .HasMaxLength(255)
                .IsRequired();
            
            entity.Property(e => e.Answer)
                .HasMaxLength(255)
                .IsRequired();
        });
    }
}
