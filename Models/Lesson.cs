using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Crux.Models;

[PrimaryKey(nameof(Id))]
public class Lesson
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public required string Title { get; set; }
    
    [Required]
    [MaxLength(255)]
    public required string Summary { get; set; }
}
