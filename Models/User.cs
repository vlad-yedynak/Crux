using System.ComponentModel.DataAnnotations;

namespace Crux.Models;

public class User
{
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
}
