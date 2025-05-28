using Crux.Models.Entities;

namespace Crux.Models.Cards;

public class EducationalCard : Card
{
    // Content stored in HTML or RTF
    public string? Content { get; set; }

    public List<CardImage> Images { get; set; } = [];

    public List<CardAttachment> Attachments { get; set; } = [];
}
