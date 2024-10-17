/* eslint-disable no-const-assign */

const Months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const Days = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

function GetDate(date){
    let months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    let day = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
    let ObjectDateItem = 
    { 
        "Ano" : date.getFullYear(), 
        "Mes" : [date.getMonth() + 1, months[date.getMonth()]],
        "Data" : date.getDate(), 
        "Horas" : date.getHours(), 
        "Minutos" : date.getMinutes(), 
        "Segundos" : date.getSeconds(), 
        "Dia" : day[date.getDay()]
    };
    return ObjectDateItem;
}

function AddDaysInDate(date,days){
    let ano = date.Ano;
    let mes = date.Mes[0];
    let data = date.Data;
    let horas = date.Horas;
    let minutos = date.Minutos;
    let segundos = date.Segundos;
    let newDate = new Date(ano,mes -1,data,horas,minutos,segundos,0);
    newDate.setDate(newDate.getDate() + days);
    return GetDate(newDate);
}

export { GetDate, AddDaysInDate , Months, Days }  