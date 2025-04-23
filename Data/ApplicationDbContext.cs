using Crux.Models;
using Microsoft.EntityFrameworkCore;

namespace Crux.Data;

public class ApplicationDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    
    public DbSet<Lesson> Lessons { get; set; }
}
