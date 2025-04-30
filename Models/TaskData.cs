namespace Crux.Models;

public abstract class TaskData
{
    public int Id { get; set; }
    
    public Task? Task { get; set; }
    
    public int TaskId { get; set; }
    
    public int? ValueInt { get; set; }
    
    public double? ValueDouble { set; get; }
    
    public string? ValueString { get; set; }
    
    public bool? ValueBool { get; set; }

    public object? Value
    {
        get
        {
            if (ValueInt.HasValue) return ValueInt.Value;
            if (ValueDouble.HasValue) return ValueDouble.Value;
            if (ValueBool.HasValue) return ValueBool.Value;
            return ValueString ?? null;
        }
        set
        {
            if (value == null)
            {
                ValueString = null;
                ValueInt = null;
                ValueDouble = null;
                ValueBool = null;
                return;
            }
                
            var type = value.GetType();
                
            if (type == typeof(string))
            {
                ValueString = (string)value;
            }
            else if (type == typeof(int))
            {
                ValueInt = (int)value;
            }
            else if (type == typeof(double))
            {
                ValueDouble = (double)value;
            }
            else
            {
                ValueBool = (bool)value;
            }
        }
    }
}

public class ExpectedTaskData : TaskData;

public class ActualTaskData : TaskData;
