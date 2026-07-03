using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using System;
using System.Collections;
using System.Linq;
using System.Reflection;

public static class ShopIntegration
{
    // Cache the found plugin instance to avoid repeated reflection scans
    private static object? _cachedRotatorPlugin = null;

    private static object? GetRotatorPlugin()
    {
        if (_cachedRotatorPlugin != null)
        {
            try { if ((bool?)_cachedRotatorPlugin.GetType().GetProperty("IsLoaded", BindingFlags.Public | BindingFlags.Instance)?.GetValue(_cachedRotatorPlugin) != false) return _cachedRotatorPlugin; }
            catch { }
            _cachedRotatorPlugin = null;
        }

        try
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                if (assembly.GetName().Name != "HnsModeRotator") continue;

                var pluginType = assembly.GetType("HnsModeRotator.HnsModeRotatorPlugin");
                if (pluginType == null) continue;

                // Walk all loaded types looking for a live BasePlugin-derived singleton
                foreach (var domAssembly in AppDomain.CurrentDomain.GetAssemblies())
                {
                    try
                    {
                        foreach (var type in domAssembly.GetTypes())
                        {
                            if (!typeof(IPlugin).IsAssignableFrom(type) || type.IsAbstract) continue;
                            var fields = type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static);
                            foreach (var f in fields)
                            {
                                if (f.FieldType == pluginType || f.FieldType.IsSubclassOf(pluginType))
                                {
                                    var val = f.GetValue(null);
                                    if (val != null) { _cachedRotatorPlugin = val; return val; }
                                }
                            }
                        }
                    }
                    catch { }
                }

                // Fallback: search for any instantiated object of the plugin type via GC roots isn't possible,
                // so try finding it registered in CounterStrikeSharp's plugin list via reflection
                try
                {
                    var cssApiAsm = typeof(BasePlugin).Assembly;
                    var pluginHostType = cssApiAsm.GetTypes()
                        .FirstOrDefault(t => t.Name == "PluginContext" || t.Name == "CSSPlugin");
                    if (pluginHostType != null)
                    {
                        var allContexts = AppDomain.CurrentDomain.GetAssemblies()
                            .SelectMany(a => { try { return a.GetTypes(); } catch { return Array.Empty<Type>(); } })
                            .Where(t => t.IsSubclassOf(pluginType))
                            .Select(t => {
                                try { return t.GetField("Instance", BindingFlags.Public | BindingFlags.Static)?.GetValue(null); } catch { return null; }
                            })
                            .Where(v => v != null)
                            .FirstOrDefault();
                        if (allContexts != null) { _cachedRotatorPlugin = allContexts; return allContexts; }
                    }
                }
                catch { }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[BlockMaker] ShopIntegration reflection error: {ex.Message}");
        }
        return null;
    }

    public static bool IsRotatorLoaded()
    {
        return GetRotatorPlugin() != null;
    }

    public static int GetPlayerPoints(CCSPlayerController player)
    {
        if (player == null || !player.IsValid || player.IsBot) return 0;

        var rotator = GetRotatorPlugin();
        if (rotator == null) return 0;

        try
        {
            var statsField = rotator.GetType().GetField("_playerStats", BindingFlags.NonPublic | BindingFlags.Instance);
            if (statsField != null)
            {
                var playerStatsDict = statsField.GetValue(rotator) as IDictionary;
                if (playerStatsDict != null && playerStatsDict.Contains(player.SteamID))
                {
                    var playerStatsObj = playerStatsDict[player.SteamID];
                    if (playerStatsObj != null)
                    {
                        var pointsProp = playerStatsObj.GetType().GetProperty("Points");
                        if (pointsProp != null)
                        {
                            return (int)(pointsProp.GetValue(playerStatsObj) ?? 0);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[BlockMaker] ShopIntegration GetPlayerPoints error: {ex.Message}");
        }
        return 0;
    }

    public static bool DeductPlayerPoints(CCSPlayerController player, int amount)
    {
        if (player == null || !player.IsValid || player.IsBot) return false;

        var rotator = GetRotatorPlugin();
        if (rotator == null) return false;

        try
        {
            var statsField = rotator.GetType().GetField("_playerStats", BindingFlags.NonPublic | BindingFlags.Instance);
            if (statsField != null)
            {
                var playerStatsDict = statsField.GetValue(rotator) as IDictionary;
                if (playerStatsDict != null && playerStatsDict.Contains(player.SteamID))
                {
                    var playerStatsObj = playerStatsDict[player.SteamID];
                    if (playerStatsObj != null)
                    {
                        var pointsProp = playerStatsObj.GetType().GetProperty("Points");
                        if (pointsProp != null)
                        {
                            int currentPoints = (int)(pointsProp.GetValue(playerStatsObj) ?? 0);
                            if (currentPoints >= amount)
                            {
                                pointsProp.SetValue(playerStatsObj, currentPoints - amount);

                                var saveMethod = rotator.GetType().GetMethod("SaveStats", BindingFlags.NonPublic | BindingFlags.Instance);
                                if (saveMethod != null)
                                {
                                    saveMethod.Invoke(rotator, null);
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[BlockMaker] ShopIntegration DeductPlayerPoints error: {ex.Message}");
        }
        return false;
    }
}
