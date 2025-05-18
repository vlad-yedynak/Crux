using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class CardImageRequest
{
    [Required]
    [Url]
    [JsonPropertyName("url")]
    public required string Url { get; set; }

    [JsonPropertyName("caption")]
    public string? Caption { get; set; }

    [JsonPropertyName("altText")]
    public string? AltText { get; set; }
}
