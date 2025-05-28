using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Crux.Models.Entities;

namespace Crux.Models.Requests;

public class TaskRequest
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
    [Required]
    [JsonPropertyName("name")]
    [MaxLength(255)]
    public required string Name { get; set; }
    
    [Required]
    [JsonPropertyName("description")]
    [MaxLength(255)]
    public required string Description { get; set; }
    
    [Required]
    [JsonPropertyName("points")]
    public required int Points { get; set; }
    
    [Required]
    [JsonPropertyName("sandboxCardId")]
    public required int SandboxCardId { get; set; }
    
    [Required]
    [JsonPropertyName("expectedData")]
    public required ICollection<TaskData> ExpectedData { get; set; }
}
