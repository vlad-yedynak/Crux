using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class EducationalCardDataRequest
{
    [Required]
    [JsonPropertyName("cardId")]
    public required int CardId { get; set; }
    
    [Required]
    [MaxLength(65535)]
    [JsonPropertyName("content")]
    public required string Content { get; set; }

    [JsonPropertyName("images")]
    public List<CardImageRequest>? Images { get; set; }

    [JsonPropertyName("attachments")]
    public List<CardAttachmentRequest>? Attachments { get; set; }
}
