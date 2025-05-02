using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class ContentRequest
{
    [Required]
    [JsonPropertyName("cardId")]
    public required int CardId { get; set; }
    
    [Required]
    [MaxLength(65535)]
    [JsonPropertyName("content")]
    public required string Content { get; set; }
}
