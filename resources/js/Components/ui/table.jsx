import React from 'react';

const Table = ({ children, className = "" }) => (
    <div className="relative overflow-auto">
        <table className={`w-full caption-bottom text-sm ${className}`}>
            {children}
        </table>
    </div>
);

const TableHeader = ({ children, className = "" }) => (
    <thead className={`[&_tr]:border-b ${className}`}>
        {children}
    </thead>
);

const TableBody = ({ children, className = "" }) => (
    <tbody className={`[&_tr:last-child]:border-0 ${className}`}>
        {children}
    </tbody>
);

const TableRow = ({ children, className = "" }) => (
    <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}>
        {children}
    </tr>
);

const TableHead = ({ children, className = "" }) => (
    <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
        {children}
    </th>
);

const TableCell = ({ children, className = "" }) => (
    <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
        {children}
    </td>
);

const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "text-foreground border border-input",
        success: "bg-green-500 text-white",
        warning: "bg-yellow-500 text-black"
    };

    return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge };