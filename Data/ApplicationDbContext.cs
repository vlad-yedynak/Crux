using Crux.Models;
using Microsoft.EntityFrameworkCore;

namespace Crux.Data;

public class ApplicationDbContext: DbContext
{
    public DbSet<User> Users { get; set; }
    private string? _connectionString;

    public void SetConnectionString(string? connectionString)
    {
        if (connectionString != null)
        {
            _connectionString = connectionString;
        }
        else
        {
            throw new ApplicationException("Connection string is required.");
        }
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseMySQL(_connectionString);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FirstName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Password).IsRequired();
        });
    }
}
