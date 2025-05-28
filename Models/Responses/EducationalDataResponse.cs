using System.Text.Json.Serialization;
using Crux.Models.Cards;

namespace Crux.Models.Responses;

public class EducationalDataResponse : Response
{
    [JsonPropertyName("cardId")]
    public int? CardId { get; set; }
    
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    
    [JsonPropertyName("images")]
    public List<CardImage>? Images { get; set; }
    
    [JsonPropertyName("attachments")]
    public List<CardAttachment>? Attachments { get; set; }
}
