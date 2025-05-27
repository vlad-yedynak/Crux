using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class CardAttachmentRequest
{
    [Required]
    [JsonPropertyName("data")]
    public required string Data { get; set; }

    [Required]
    [JsonPropertyName("contentType")]
    public required string ContentType { get; set; }

    [JsonPropertyName("fileName")]
    public string? FileName { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}
