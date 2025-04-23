using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Crux.Models;

[PrimaryKey(nameof(Id))]
[Index(nameof(Email), IsUnique = true)]
public class User
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public required string FirstName { get; set; }
    
    [Required]
    [MaxLength(255)]
    public required string LastName { get; set; }
    
    [Required]
    [MaxLength(255)]
    public required string Email { get; set; }
    
    [Required]
    [MinLength(6)]
    [MaxLength(255)]
    public required string Password { get; set; }
    
    [Required]
    public required int ScorePoints { get; set; }
}
