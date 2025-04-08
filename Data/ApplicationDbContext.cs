using Crux.Models;
using Microsoft.EntityFrameworkCore;

namespace Crux.Data;

public class ApplicationDbContext: DbContext
{
    private string? _connectionString;
    
    public DbSet<User> Users { get; set; }

    public void SetConnectionString(string? connectionString)
    {
        if (connectionString != null)
        {
            _connectionString = connectionString;
        }
        else
        {
            throw new ApplicationException("Connection string cannot be null");
        }
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (_connectionString != null)
        {
            optionsBuilder.UseMySQL(_connectionString);
        }
        else
        {
            throw new ApplicationException("Connection string cannot be null");
        }
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
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Password).IsRequired();
        });
    }
}
