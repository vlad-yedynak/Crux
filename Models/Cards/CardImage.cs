namespace Crux.Models.Cards;

public class CardImage
{
    public int Id { get; set; }
    
    public required string Url { get; set; }
    
    public required string Caption { get; set; }
    
    public required string AltText { get; set; }
    
    public EducationalCard EducationalCard { get; set; }
    
    public int EducationalCardId { get; set; }
}
